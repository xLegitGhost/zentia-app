# Zentia Frontend — QA Checklist & Stand Readiness (`TASK-504`)

## 1. Backend & API Verification (`https://zentia-backend-5l77.onrender.com/api/v1`)
- [x] `GET /api/v1/categories` verified HTTP 200 JSON (13 categorías reales `INGRESO`/`GASTO`)
- [x] CORS verified for `Origin: http://localhost:8081` (`access-control-allow-credentials: true`)
- [x] Endpoints aligned in `src/types/api.ts`, `src/hooks/useDashboard.ts`, `src/hooks/useCreateTransaction.ts`, `src/hooks/useUpdateTransaction.ts`, `src/hooks/useDeleteTransaction.ts`, `src/infrastructure/adapters/HttpFinancialProfileAdapter.ts`

## 2. Public FX REST API (`https://open.er-api.com/v6/latest/MXN`)
- [x] `src/services/exchangeRates.ts` consumes `https://open.er-api.com/v6/latest/MXN` via unauthenticated `globalThis.fetch` (never uses the Zentia `api` Axios instance, guaranteeing `Authorization: Bearer <JWT>` is never sent to third-party origins)
- [x] Payload validation (`parseExchangeRatesResponse`), conversion math (`convertFromMxn`, `getInverseMxnRate`, `formatInverseMxnRate`, `formatForeignCurrency`), and typed `ExchangeRateError` implemented
- [x] Public cache key `fx_rates_mxn` added to `PUBLIC_CACHE_KEYS` in `src/services/cacheStorage.ts` (retained on logout / `401`) with `60 min` SWR TTL (`FX_CACHE_TTL_MS`) and `7d` offline stale fallback (`FX_STALE_FALLBACK_MAX_AGE_MS`)
- [x] `useExchangeRates` (`src/hooks/useExchangeRates.ts`) and `ExchangeRateCard` (`src/components/dashboard/ExchangeRateCard.tsx`, with `hasMounted` SSR hydration guard preventing React `#418` mismatch on warm reload) mounted in `src/app/(tabs)/index.tsx` for `USD`, `EUR`, and `CAD` conversion of `summary.balanceActual`

## 3. Kaluri Placement Exclusivity (Profile Only)
- [x] `grep -rn "Kaluri" src/` verified `KaluriPromoCard` (`"Also try Kaluri.app"` + code `URIEL15`) is mounted ONLY in `src/app/(tabs)/profile.tsx` (component definitions in `src/components/ui/KaluriEasterEgg.tsx`)
- [x] Removed `KaluriSplashBanner` from `src/app/(tabs)/index.tsx` (along with unused `brandTaps` state) and `src/app/(auth)/login.tsx`
- [x] Removed `KaluriFoodHint` from `src/app/(modal)/new-transaction.tsx`

## 4. CSP & Security Headers (`vercel.json`)
- [x] `Content-Security-Policy` `connect-src` includes `https://open.er-api.com` alongside `'self'`, `https://zentia-backend-5l77.onrender.com`, `https://accounts.google.com`, `https://www.googleapis.com`, and `https://oauth2.googleapis.com`
- [x] `script-src` remains strict (`'self'`, sha256 hash, `https://accounts.google.com/gsi/client`) without `'unsafe-eval'` or `'unsafe-inline'`; `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy` enforced
- [x] Post-build Brave Headless CDP smoke check on fresh `npx expo export -p web` (`dist/`, 17 static routes) with exact `vercel.json` headers passed: live `https://open.er-api.com/v6/latest/MXN` GET returned HTTP `200` with zero `Authorization` header and `0` CSP violations; `warm:/(tabs)` with `zentia_cache_v1:fx_rates_mxn` in `localStorage` rendered cached FX with `0` React `#418` hydration exceptions; Home rendered live `ExchangeRateCard` (`USD`/`EUR`/`CAD`) with zero Kaluri copy; `/profile` rendered `"Also try Kaluri.app"` + `"URIEL15"`; and demo CRUD flow (`/new-transaction`, `/transactions`, `/edit-transaction`) passed end-to-end with `0` page exceptions

## 5. Automated Testing (`pnpm test` & TypeScript)
- [x] `pnpm tsc --noEmit` exits `0` across the entire repository
- [x] `pnpm test` (`node scripts/run-tests.mjs`) passes **18 / 18** checks (`Summary: 18 passed, 0 failed`):
  - `[typecheck]` (1): full-repo `pnpm tsc --noEmit`
  - `[security]` (4): `sanitizeApiBaseUrl`, `isJwtExpiredClientSide`, `isSafeExternalUrl`
  - `[idempotency]` (9): UUID v4 generation, `buildIntentFingerprint`, single-flight coalescing, completed-key replay cache, POST non-auto-retry + manual retry key reuse, PUT/DELETE 503 auto-retry & 400 non-retry, Web offline guard, `classifyMutationError`, Web vs Native `Idempotency-Key` header gating
  - `[exchangeRates]` (4): `parseExchangeRatesResponse`, invalid payload `ExchangeRateError` rejection, `convertFromMxn` & inverse `1 / rate` math, unauthenticated `fetchMxnExchangeRates` + public cache SWR + 503 stale fallback

## 6. Google OAuth Web Verification
- [x] `@react-oauth/google` loads `https://accounts.google.com/gsi/client`
- [x] Clicking **Continuar con Google** opens `https://accounts.google.com/v3/signin/identifier` without `origin_mismatch` on `http://localhost:8081`
- [ ] Repeat authorization in Google Cloud Console for the final Vercel production domain once deployed (`https://<tu-app>.vercel.app`)

## 7. Responsive Web & Screen Smoke Tests (Brave Headless CDP)
- [x] Desktop (`1280x800`): `ResponsiveAppShell` centered at `448px` (`max-w-md`)
- [x] Mobile (`390x844`): `ResponsiveAppShell` spans `390px` full-width
- [x] Cold routes verified with `0` page exceptions: `/login`, `/(tabs)`, `/(tabs)/transactions`, `/(tabs)/profile`, `/(modal)/new-transaction`, `/(modal)/edit-transaction`
- [x] Demo CRUD flow verified in Brave Headless CDP: created `$10,000` income via `+` FAB -> `/new-transaction`, read in `/transactions`, edited to `$12,500` via `/edit-transaction`, and deleted in `/transactions`

## 8. Production Export & Stand QR (`TASK-502`, `TASK-503`)
- [x] `vercel.json` configured (`buildCommand: npx expo export -p web`, `outputDirectory: dist`)
- [x] `npx expo export -p web` verified cleanly (exit `0`, 17 static routes in `dist/`)
- [x] `docs/assets/demo-qr.png` generated (`pnpm run generate:qr`) and `StandQRCard` embedded in Profile
- [ ] Deploy `zentia-frontend` to Vercel with `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, and `EXPO_PUBLIC_DEMO_URL`
- [ ] Re-run `EXPO_PUBLIC_DEMO_URL=<url-vercel> pnpm run generate:qr` if the Vercel URL differs from `https://zentia.vercel.app`
- [ ] Manual physical test on Expo Go (iOS / Android) for Face ID / Fingerprint biometric lock (`expo-local-authentication`) and concurrent sync with browser
