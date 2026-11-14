import { useCallback, useEffect, useRef } from 'react';
import { generateIdempotencyKey } from '@/services/idempotency';

/**
 * Mantiene una clave de idempotencia estable por intención lógica de formulario:
 * - Se conserva idéntica entre reintentos tras fallas de red/timeout (CU-10).
 * - Se regenera automáticamente si el usuario modifica los datos de la operación.
 */
export function useIdempotencyKey(intentFingerprint: string) {
  const keyRef = useRef<string>(generateIdempotencyKey());
  const prevFingerprintRef = useRef<string>(intentFingerprint);

  useEffect(() => {
    if (prevFingerprintRef.current !== intentFingerprint) {
      prevFingerprintRef.current = intentFingerprint;
      keyRef.current = generateIdempotencyKey();
    }
  }, [intentFingerprint]);

  const getKey = useCallback(() => {
    if (prevFingerprintRef.current !== intentFingerprint) {
      prevFingerprintRef.current = intentFingerprint;
      keyRef.current = generateIdempotencyKey();
    }
    return keyRef.current;
  }, [intentFingerprint]);

  const rotateKey = useCallback(() => {
    keyRef.current = generateIdempotencyKey();
    return keyRef.current;
  }, []);

  return { getKey, rotateKey };
}

export default useIdempotencyKey;
