import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const cjsRequire = createRequire(import.meta.url);
const Module = cjsRequire('node:module');
const repoRequire = createRequire(path.join(REPO_ROOT, 'package.json'));

function runTestCase(suite, name, fn, results) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      results.passed += 1;
      console.log(`  PASS  [${suite}] ${name}`);
    })
    .catch((err) => {
      results.failed += 1;
      console.error(`  FAIL  [${suite}] ${name}`);
      console.error(err);
    });
}

function makeFakeJwt(payloadObj) {
  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payloadObj)}.signature`;
}

function makeAxiosError(axiosMod, { status, data, code, message, hasResponse = true }) {
  const { AxiosError } = axiosMod;
  const response =
    hasResponse && status !== undefined
      ? {
          status,
          statusText: String(status),
          headers: {},
          config: {},
          data: data ?? {},
        }
      : undefined;
  return new AxiosError(
    message ?? `Request failed with status ${status ?? 'NETWORK'}`,
    code ?? (status ? 'ERR_BAD_RESPONSE' : 'ERR_NETWORK'),
    {},
    {},
    response
  );
}

function withMockNavigator(onLineValue, fn) {
  const originalDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: onLineValue },
    configurable: true,
    enumerable: true,
    writable: true,
  });
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (originalDesc) {
        Object.defineProperty(globalThis, 'navigator', originalDesc);
      } else {
        delete globalThis.navigator;
      }
    });
}

function compileSelectedModules(tmpDir, relativeSourceFiles) {
  const tscBin = path.join(
    REPO_ROOT,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsc.cmd' : 'tsc'
  );

  execFileSync(
    tscBin,
    [
      '--ignoreConfig',
      '--outDir',
      tmpDir,
      '--rootDir',
      path.join(REPO_ROOT, 'src'),
      '--module',
      'commonjs',
      '--target',
      'es2022',
      '--esModuleInterop',
      '--skipLibCheck',
      '--strict',
      '--lib',
      'dom,esnext',
      '--types',
      'expo/types',
      ...relativeSourceFiles.map((file) => path.join(REPO_ROOT, file)),
    ],
    {
      cwd: REPO_ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    }
  );
}

async function main() {
  const results = { passed: 0, failed: 0 };
  const tmpDir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'zentia-unit-tests-'))
  );

  const reactNativeMock = {
    Platform: { OS: 'web' },
    Linking: {
      openURL: async () => true,
    },
  };

  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'react-native') {
      return reactNativeMock;
    }
    if (
      parent?.filename &&
      parent.filename.startsWith(tmpDir) &&
      !request.startsWith('.') &&
      !path.isAbsolute(request) &&
      !request.startsWith('node:')
    ) {
      return repoRequire(request);
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  const loadCompiled = (relCompiledPath) => {
    const target = path.join(tmpDir, relCompiledPath);
    delete cjsRequire.cache[target];
    return cjsRequire(target);
  };

  try {
    console.log('1/2 Running full-repo strict TypeScript check (pnpm tsc --noEmit)...');
    await runTestCase(
      'typecheck',
      'pnpm tsc --noEmit passes with zero errors',
      () => {
        execFileSync('pnpm', ['tsc', '--noEmit'], {
          cwd: REPO_ROOT,
          stdio: 'pipe',
          encoding: 'utf8',
          shell: process.platform === 'win32',
        });
      },
      results
    );

    const modulesToCompile = [
      'src/services/cacheStorage.ts',
      'src/services/exchangeRates.ts',
      'src/services/idempotency.ts',
      'src/services/security.ts',
    ];

    compileSelectedModules(tmpDir, modulesToCompile);

    const axiosMod = repoRequire('axios');
    const security = loadCompiled('services/security.js');
    const cacheStorageMod = loadCompiled('services/cacheStorage.js');
    const exchangeRates = loadCompiled('services/exchangeRates.js');
    const idempotency = loadCompiled('services/idempotency.js');

    console.log('2/2 Running unit test suites...');

    // --- Suite: security.ts ---
    await runTestCase(
      'security',
      'sanitizeApiBaseUrl upgrades remote HTTP to HTTPS and strips trailing slash',
      () => {
        assert.equal(
          security.sanitizeApiBaseUrl('http://api.zentia.example/api/v1///', false),
          'https://api.zentia.example/api/v1'
        );
        assert.equal(
          security.sanitizeApiBaseUrl('https://zentia-backend-5l77.onrender.com/api/v1/', false),
          'https://zentia-backend-5l77.onrender.com/api/v1'
        );
      },
      results
    );

    await runTestCase(
      'security',
      'sanitizeApiBaseUrl preserves HTTP loopback hosts in dev/prod and rejects bad schemes',
      () => {
        assert.equal(
          security.sanitizeApiBaseUrl('http://localhost:8080/api/v1/', true),
          'http://localhost:8080/api/v1'
        );
        assert.equal(
          security.sanitizeApiBaseUrl('http://127.0.0.1:8080/api/v1', true),
          'http://127.0.0.1:8080/api/v1'
        );
        assert.equal(
          security.sanitizeApiBaseUrl('http://10.0.2.2:8080/api/v1', true),
          'http://10.0.2.2:8080/api/v1'
        );
        assert.equal(
          security.sanitizeApiBaseUrl('javascript:alert(1)', false),
          'https://zentia-backend-5l77.onrender.com/api/v1'
        );
        assert.equal(
          security.sanitizeApiBaseUrl('ftp://files.example.com/api', true),
          'http://localhost:8080/api/v1'
        );
        assert.equal(
          security.sanitizeApiBaseUrl('not-a-valid-url', false),
          'https://zentia-backend-5l77.onrender.com/api/v1'
        );
        assert.equal(
          security.sanitizeApiBaseUrl(undefined, false),
          'https://zentia-backend-5l77.onrender.com/api/v1'
        );
      },
      results
    );

    await runTestCase(
      'security',
      'isJwtExpiredClientSide handles past, boundary, future, and malformed tokens',
      () => {
        const nowMs = 1_700_000_000_000;
        const nowSec = Math.floor(nowMs / 1000);
        assert.equal(security.isJwtExpiredClientSide(makeFakeJwt({ exp: nowSec - 10 }), nowMs), true);
        assert.equal(security.isJwtExpiredClientSide(makeFakeJwt({ exp: nowSec }), nowMs), true);
        assert.equal(security.isJwtExpiredClientSide(makeFakeJwt({ exp: nowSec + 60 }), nowMs), false);
        assert.equal(security.isJwtExpiredClientSide(makeFakeJwt({ sub: '123' }), nowMs), false);
        assert.equal(security.isJwtExpiredClientSide('invalid.token', nowMs), false);
        assert.equal(security.isJwtExpiredClientSide('a.!!!.c', nowMs), false);
      },
      results
    );

    await runTestCase(
      'security',
      'isSafeExternalUrl allows HTTPS and HTTP loopback only',
      () => {
        assert.equal(security.isSafeExternalUrl('https://kaluri.app/?ref=zentia'), true);
        assert.equal(security.isSafeExternalUrl('http://localhost:8081/callback'), true);
        assert.equal(security.isSafeExternalUrl('http://127.0.0.1:3000'), true);
        assert.equal(security.isSafeExternalUrl('http://10.0.2.2:8080'), true);
        assert.equal(security.isSafeExternalUrl('http://kaluri.app'), false);
        assert.equal(security.isSafeExternalUrl('javascript:alert(1)'), false);
        assert.equal(security.isSafeExternalUrl('file:///etc/passwd'), false);
        assert.equal(security.isSafeExternalUrl('data:text/html,<h1>x</h1>'), false);
        assert.equal(security.isSafeExternalUrl('not-a-url'), false);
      },
      results
    );

    // --- Suite: idempotency.ts ---
    await runTestCase(
      'idempotency',
      'generateIdempotencyKey emits valid unique UUID v4 strings (crypto and fallback)',
      () => {
        const uuidV4Regex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const keys = new Set();
        for (let i = 0; i < 50; i += 1) {
          const key = idempotency.generateIdempotencyKey();
          assert.match(key, uuidV4Regex);
          keys.add(key);
        }
        assert.equal(keys.size, 50);

        const origCryptoDesc = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
        Object.defineProperty(globalThis, 'crypto', {
          value: undefined,
          configurable: true,
        });
        try {
          const fallbackKey = idempotency.generateIdempotencyKey();
          assert.match(fallbackKey, uuidV4Regex);
        } finally {
          if (origCryptoDesc) {
            Object.defineProperty(globalThis, 'crypto', origCryptoDesc);
          }
        }
      },
      results
    );

    await runTestCase(
      'idempotency',
      'buildIntentFingerprint is key-order independent and sensitive to values',
      () => {
        const fp1 = idempotency.buildIntentFingerprint([
          'POST',
          { amount: 250.5, categoryId: 3, meta: { b: 2, a: 1 }, ignored: undefined },
        ]);
        const fp2 = idempotency.buildIntentFingerprint([
          'POST',
          { meta: { a: 1, b: 2 }, categoryId: 3, amount: 250.5 },
        ]);
        const fp3 = idempotency.buildIntentFingerprint([
          'POST',
          { amount: 250.51, categoryId: 3, meta: { a: 1, b: 2 } },
        ]);
        assert.equal(fp1, fp2);
        assert.notEqual(fp1, fp3);
      },
      results
    );

    await runTestCase(
      'idempotency',
      'single-flight coalesces concurrent POST calls with same key into one execution',
      async () => {
        const key = idempotency.generateIdempotencyKey();
        let execCount = 0;
        let releaseGate;
        const gate = new Promise((resolve) => {
          releaseGate = resolve;
        });

        const p1 = idempotency.runIdempotentOperation({
          scope: 'test-sf',
          operation: 'create-tx',
          method: 'POST',
          idempotencyKey: key,
          cacheCompleted: false,
          execute: async (receivedKey) => {
            execCount += 1;
            assert.equal(receivedKey, key);
            await gate;
            return { id: 99, key: receivedKey };
          },
        });

        const p2 = idempotency.runIdempotentOperation({
          scope: 'test-sf',
          operation: 'create-tx',
          method: 'POST',
          idempotencyKey: key,
          cacheCompleted: false,
          execute: async () => {
            execCount += 1;
            return { id: 100 };
          },
        });

        releaseGate();
        const [r1, r2] = await Promise.all([p1, p2]);
        assert.equal(execCount, 1);
        assert.deepEqual(r1, { id: 99, key });
        assert.deepEqual(r2, { id: 99, key });
      },
      results
    );

    await runTestCase(
      'idempotency',
      'completed-key replay cache returns cached result without re-executing',
      async () => {
        const key = idempotency.generateIdempotencyKey();
        let execCount = 0;

        const first = await idempotency.runIdempotentOperation({
          scope: 'test-replay',
          operation: 'create-tx',
          method: 'POST',
          idempotencyKey: key,
          execute: async () => {
            execCount += 1;
            return { id: 42, status: 'created' };
          },
        });

        const second = await idempotency.runIdempotentOperation({
          scope: 'test-replay',
          operation: 'create-tx',
          method: 'POST',
          idempotencyKey: key,
          execute: async () => {
            execCount += 1;
            return { id: 43, status: 'duplicate' };
          },
        });

        assert.equal(execCount, 1);
        assert.deepEqual(first, { id: 42, status: 'created' });
        assert.deepEqual(second, { id: 42, status: 'created' });
        cacheStorageMod.cacheStorage.remove(`idem:test-replay:create-tx:${key}`);
      },
      results
    );

    await runTestCase(
      'idempotency',
      'POST does not auto-retry by default, while manual retry reuses same key and succeeds',
      async () => {
        const key = idempotency.generateIdempotencyKey();
        const seenKeys = [];
        let calls = 0;

        await assert.rejects(
          () =>
            idempotency.runIdempotentOperation({
              scope: 'test-post-retry',
              operation: 'create-tx',
              method: 'POST',
              idempotencyKey: key,
              baseDelayMs: 1,
              execute: async (receivedKey) => {
                calls += 1;
                seenKeys.push(receivedKey);
                throw makeAxiosError(axiosMod, { status: 503 });
              },
            }),
          (err) => err?.response?.status === 503
        );
        assert.equal(calls, 1);

        const retryResult = await idempotency.runIdempotentOperation({
          scope: 'test-post-retry',
          operation: 'create-tx',
          method: 'POST',
          idempotencyKey: key,
          baseDelayMs: 1,
          execute: async (receivedKey) => {
            calls += 1;
            seenKeys.push(receivedKey);
            return { ok: true, id: 77 };
          },
        });

        assert.equal(calls, 2);
        assert.deepEqual(seenKeys, [key, key]);
        assert.deepEqual(retryResult, { ok: true, id: 77 });
        cacheStorageMod.cacheStorage.remove(`idem:test-post-retry:create-tx:${key}`);
      },
      results
    );

    await runTestCase(
      'idempotency',
      'PUT and DELETE auto-retry transient 503 errors and never auto-retry 400 errors',
      async () => {
        let putAttempts = 0;
        const putRes = await idempotency.runIdempotentOperation({
          scope: 'test-put',
          operation: 'update-tx',
          method: 'PUT',
          baseDelayMs: 1,
          cacheCompleted: false,
          execute: async (_key, attempt) => {
            putAttempts += 1;
            if (attempt < 2) {
              throw makeAxiosError(axiosMod, { status: 503 });
            }
            return { updated: true, attempt };
          },
        });
        assert.equal(putAttempts, 3);
        assert.deepEqual(putRes, { updated: true, attempt: 2 });

        let delAttempts = 0;
        const delRes = await idempotency.runIdempotentOperation({
          scope: 'test-del',
          operation: 'delete-tx',
          method: 'DELETE',
          baseDelayMs: 1,
          cacheCompleted: false,
          execute: async (_key, attempt) => {
            delAttempts += 1;
            if (attempt === 0) {
              throw makeAxiosError(axiosMod, { status: 503 });
            }
            return { deleted: true, attempt };
          },
        });
        assert.equal(delAttempts, 2);
        assert.deepEqual(delRes, { deleted: true, attempt: 1 });

        let badReqAttempts = 0;
        await assert.rejects(
          () =>
            idempotency.runIdempotentOperation({
              scope: 'test-400',
              operation: 'update-tx',
              method: 'PUT',
              baseDelayMs: 1,
              cacheCompleted: false,
              execute: async () => {
                badReqAttempts += 1;
                throw makeAxiosError(axiosMod, {
                  status: 400,
                  data: { message: 'Monto inválido' },
                });
              },
            }),
          (err) => err?.response?.status === 400
        );
        assert.equal(badReqAttempts, 1);
      },
      results
    );

    await runTestCase(
      'idempotency',
      'offline guard blocks execution on Web when navigator.onLine is false',
      async () => {
        reactNativeMock.Platform.OS = 'web';
        await withMockNavigator(false, async () => {
          assert.equal(idempotency.isDeviceOffline(), true);
          let executed = false;
          await assert.rejects(
            () =>
              idempotency.runIdempotentOperation({
                scope: 'test-offline',
                operation: 'create-tx',
                method: 'POST',
                requireOnline: true,
                execute: async () => {
                  executed = true;
                  return { ok: true };
                },
              }),
            (err) =>
              err instanceof idempotency.IdempotentNetworkError &&
              err.code === 'OFFLINE' &&
              err.retryable === true
          );
          assert.equal(executed, false);
        });

        reactNativeMock.Platform.OS = 'ios';
        await withMockNavigator(false, async () => {
          assert.equal(idempotency.isDeviceOffline(), false);
        });
        reactNativeMock.Platform.OS = 'web';
      },
      results
    );

    await runTestCase(
      'idempotency',
      'classifyMutationError categorizes offline, timeout, network, conflict, auth, validation, and server errors',
      async () => {
        const offline = idempotency.classifyMutationError(
          new idempotency.IdempotentNetworkError('OFFLINE', 'offline')
        );
        assert.equal(offline.kind, 'offline');
        assert.equal(offline.retryable, true);

        const timeout = idempotency.classifyMutationError(
          makeAxiosError(axiosMod, { code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded', hasResponse: false })
        );
        assert.equal(timeout.kind, 'timeout');
        assert.equal(timeout.retryable, true);

        await withMockNavigator(true, () => {
          const netErr = idempotency.classifyMutationError(
            makeAxiosError(axiosMod, { code: 'ERR_NETWORK', message: 'Network Error', hasResponse: false })
          );
          assert.equal(netErr.kind, 'network');
          assert.equal(netErr.retryable, true);
        });

        const conflict = idempotency.classifyMutationError(
          makeAxiosError(axiosMod, { status: 409, data: { error: 'Duplicado' } })
        );
        assert.equal(conflict.kind, 'conflict');
        assert.equal(conflict.status, 409);
        assert.equal(conflict.message, 'Duplicado');
        assert.equal(conflict.retryable, false);

        const auth = idempotency.classifyMutationError(makeAxiosError(axiosMod, { status: 401 }));
        assert.equal(auth.kind, 'auth');
        assert.equal(auth.retryable, false);

        const validation = idempotency.classifyMutationError(
          makeAxiosError(axiosMod, { status: 400, data: { message: 'Categoría requerida' } })
        );
        assert.equal(validation.kind, 'validation');
        assert.equal(validation.message, 'Categoría requerida');
        assert.equal(validation.retryable, false);

        const server = idempotency.classifyMutationError(makeAxiosError(axiosMod, { status: 503 }));
        assert.equal(server.kind, 'server');
        assert.equal(server.retryable, true);

        const unknown = idempotency.classifyMutationError(new Error('boom'), 'Fallback msg');
        assert.equal(unknown.kind, 'unknown');
        assert.equal(unknown.message, 'Fallback msg');
        assert.equal(unknown.retryable, false);
      },
      results
    );

    await runTestCase(
      'idempotency',
      'Web vs Native Idempotency-Key header gating respects Platform.OS and env opt-in',
      () => {
        const prevHeaderEnv = process.env.EXPO_PUBLIC_ENABLE_IDEMPOTENCY_HEADER;
        const prevBackendEnv = process.env.EXPO_PUBLIC_BACKEND_IDEMPOTENT;
        try {
          delete process.env.EXPO_PUBLIC_ENABLE_IDEMPOTENCY_HEADER;
          delete process.env.EXPO_PUBLIC_BACKEND_IDEMPOTENT;
          const freshDefault = loadCompiled('services/idempotency.js');

          reactNativeMock.Platform.OS = 'web';
          assert.equal(freshDefault.IS_IDEMPOTENCY_HEADER_ENABLED, false);
          assert.equal(freshDefault.shouldAttachIdempotencyHeader(), false);

          reactNativeMock.Platform.OS = 'ios';
          assert.equal(freshDefault.shouldAttachIdempotencyHeader(), true);

          reactNativeMock.Platform.OS = 'android';
          assert.equal(freshDefault.shouldAttachIdempotencyHeader(), true);

          process.env.EXPO_PUBLIC_ENABLE_IDEMPOTENCY_HEADER = 'true';
          process.env.EXPO_PUBLIC_BACKEND_IDEMPOTENT = 'true';
          const freshEnabled = loadCompiled('services/idempotency.js');

          reactNativeMock.Platform.OS = 'web';
          assert.equal(freshEnabled.IS_IDEMPOTENCY_HEADER_ENABLED, true);
          assert.equal(freshEnabled.IS_BACKEND_IDEMPOTENCY_ENFORCED, true);
          assert.equal(freshEnabled.shouldAttachIdempotencyHeader(), true);
        } finally {
          reactNativeMock.Platform.OS = 'web';
          if (prevHeaderEnv === undefined) {
            delete process.env.EXPO_PUBLIC_ENABLE_IDEMPOTENCY_HEADER;
          } else {
            process.env.EXPO_PUBLIC_ENABLE_IDEMPOTENCY_HEADER = prevHeaderEnv;
          }
          if (prevBackendEnv === undefined) {
            delete process.env.EXPO_PUBLIC_BACKEND_IDEMPOTENT;
          } else {
            process.env.EXPO_PUBLIC_BACKEND_IDEMPOTENT = prevBackendEnv;
          }
        }
      },
      results
    );

    // --- Suite: exchangeRates.ts ---
    await runTestCase(
      'exchangeRates',
      'parseExchangeRatesResponse parses valid open.er-api.com payload and strips invalid rate entries',
      () => {
        const parsed = exchangeRates.parseExchangeRatesResponse({
          result: 'success',
          base_code: 'MXN',
          time_last_update_utc: ' Thu, 19 Nov 2026 00:00:01 +0000 ',
          time_next_update_utc: ' Fri, 20 Nov 2026 00:00:01 +0000 ',
          rates: {
            USD: 0.05,
            eur: 0.046,
            CAD: 0.07,
            BAD_NEG: -1,
            BAD_ZERO: 0,
            BAD_STR: '0.05',
            BAD_NAN: Number.NaN,
          },
        });

        assert.equal(parsed.baseCode, 'MXN');
        assert.equal(parsed.updatedAtUtc, 'Thu, 19 Nov 2026 00:00:01 +0000');
        assert.equal(parsed.nextUpdateUtc, 'Fri, 20 Nov 2026 00:00:01 +0000');
        assert.equal(parsed.rates.USD, 0.05);
        assert.equal(parsed.rates.EUR, 0.046);
        assert.equal(parsed.rates.CAD, 0.07);
        assert.equal('BAD_NEG' in parsed.rates, false);
        assert.equal('BAD_ZERO' in parsed.rates, false);
        assert.equal('BAD_STR' in parsed.rates, false);
        assert.equal('BAD_NAN' in parsed.rates, false);
      },
      results
    );

    await runTestCase(
      'exchangeRates',
      'parseExchangeRatesResponse rejects missing or invalid payloads with ExchangeRateError',
      () => {
        const invalidPayloads = [
          null,
          'invalid',
          [],
          { result: 'error', base_code: 'MXN', rates: { USD: 0.05 } },
          { result: 'success', base_code: 'USD', rates: { USD: 1 } },
          { result: 'success', base_code: 'MXN', rates: null },
          { result: 'success', base_code: 'MXN', rates: { JPY: 8.5 } },
          { result: 'success', base_code: 'MXN', rates: { USD: 0, EUR: -2, CAD: Number.NaN } },
        ];

        for (const payload of invalidPayloads) {
          assert.throws(
            () => exchangeRates.parseExchangeRatesResponse(payload),
            (err) => err instanceof exchangeRates.ExchangeRateError && err.retryable === false
          );
        }
      },
      results
    );

    await runTestCase(
      'exchangeRates',
      'convertFromMxn and inverse rate math (1 / rate) handle valid and edge inputs',
      () => {
        assert.equal(exchangeRates.convertFromMxn(1000, 0.05), 50);
        assert.equal(exchangeRates.convertFromMxn(-200, 0.05), -10);
        assert.equal(Object.is(exchangeRates.convertFromMxn(-0, 0.05), 0), true);
        assert.equal(exchangeRates.convertFromMxn(Number.NaN, 0.05), null);
        assert.equal(exchangeRates.convertFromMxn(100, 0), null);
        assert.equal(exchangeRates.convertFromMxn(100, -0.05), null);
        assert.equal(exchangeRates.convertFromMxn(100, undefined), null);

        assert.equal(exchangeRates.getInverseMxnRate(0.05), 20);
        assert.equal(exchangeRates.getInverseMxnRate(0.04), 25);
        assert.equal(exchangeRates.getInverseMxnRate(0), null);
        assert.equal(exchangeRates.getInverseMxnRate(-1), null);
        assert.equal(exchangeRates.getInverseMxnRate(null), null);

        assert.equal(exchangeRates.formatInverseMxnRate('usd', 0.05), '1 USD = $20.00 MXN');
        assert.equal(exchangeRates.formatInverseMxnRate('EUR', null), '1 EUR = -- MXN');
        assert.equal(exchangeRates.formatForeignCurrency(1234.5, 'USD'), '$1,234.50 USD');
        assert.equal(exchangeRates.formatForeignCurrency(-50, 'EUR'), '-€50.00 EUR');
      },
      results
    );

    await runTestCase(
      'exchangeRates',
      'fetchMxnExchangeRates uses unauthenticated GET fetch, preserves public cache, and falls back when stale',
      async () => {
        cacheStorageMod.cacheStorage.remove(exchangeRates.FX_CACHE_KEY);
        const requests = [];

        const live = await exchangeRates.fetchMxnExchangeRates({
          fetchImpl: async (url, init) => {
            requests.push({ url, init });
            return {
              ok: true,
              status: 200,
              json: async () => ({
                result: 'success',
                base_code: 'MXN',
                time_last_update_utc: 'Thu, 19 Nov 2026 00:00:01 +0000',
                rates: { USD: 0.05, EUR: 0.046, CAD: 0.07 },
              }),
            };
          },
        });

        assert.equal(requests.length, 1);
        assert.equal(requests[0].url, 'https://open.er-api.com/v6/latest/MXN');
        assert.equal(requests[0].init?.method, 'GET');
        assert.equal(requests[0].init?.headers, undefined);
        assert.equal(live.isCachedFallback, false);
        assert.equal(live.rates.USD, 0.05);

        // User cache clearing must retain public FX cache key
        cacheStorageMod.cacheStorage.clearUserCaches();
        assert.ok(exchangeRates.getCachedMxnExchangeRates());

        // Network/503 failure falls back to cached FX rates when allowStaleFallback is true
        const fallback = await exchangeRates.fetchMxnExchangeRates({
          allowStaleFallback: true,
          fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }),
        });
        assert.equal(fallback.isCachedFallback, true);
        assert.equal(fallback.rates.USD, 0.05);

        // Without fallback, HTTP 503 rejects with retryable ExchangeRateError
        await assert.rejects(
          () =>
            exchangeRates.fetchMxnExchangeRates({
              allowStaleFallback: false,
              fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }),
            }),
          (err) =>
            err instanceof exchangeRates.ExchangeRateError &&
            err.retryable === true &&
            err.status === 503
        );

        cacheStorageMod.cacheStorage.remove(exchangeRates.FX_CACHE_KEY);
      },
      results
    );

    console.log(`\nSummary: ${results.passed} passed, ${results.failed} failed`);
    if (results.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    Module._load = originalLoad;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

await main();
