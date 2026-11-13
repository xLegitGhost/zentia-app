# Zentia Frontend — QA Checklist & Stand Readiness (`TASK-504`)

## 1. Backend & API Verification (`https://zentia-backend-5l77.onrender.com/api/v1`)
- [x] `GET /api/v1/categories` verified HTTP 200 JSON (13 categorías reales `INGRESO`/`GASTO`)
- [x] CORS verified for `Origin: http://localhost:8081` (`access-control-allow-credentials: true`)
- [x] Endpoints aligned in `src/types/api.ts`, `src/hooks/useDashboard.ts`, `src/hooks/useCreateTransaction.ts`, `src/hooks/useUpdateTransaction.ts`, `src/hooks/useDeleteTransaction.ts`, `src/infrastructure/adapters/HttpFinancialProfileAdapter.ts`

## 2. Google OAuth Web Verification
- [x] `@react-oauth/google` loads `https://accounts.google.com/gsi/client`
- [x] Clicking **Continuar con Google** opens `https://accounts.google.com/v3/signin/identifier` without `origin_mismatch` on `http://localhost:8081`
- [ ] Repeat authorization in Google Cloud Console for the final Vercel production domain once deployed (`https://<tu-app>.vercel.app`)

## 3. Responsive Web & Screen Smoke Tests (Brave Headless CDP)
- [x] Desktop (`1280x800`): `ResponsiveAppShell` centered at `448px` (`max-w-md`)
- [x] Mobile (`390x844`): `ResponsiveAppShell` spans `390px` full-width
- [x] Routes verified with zero uncaught page errors: `/login`, `/(tabs)`, `/(tabs)/transactions`, `/(tabs)/profile`, `/(modal)/new-transaction`

## 4. Production Export & Stand QR (`TASK-502`, `TASK-503`)
- [x] `vercel.json` configured (`buildCommand: npx expo export -p web`, `outputDirectory: dist`)
- [x] `docs/assets/demo-qr.png` generated (`pnpm run generate:qr`) and `StandQRCard` embedded in Profile
- [ ] Deploy `zentia-frontend` to Vercel with `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, and `EXPO_PUBLIC_DEMO_URL`
- [ ] Re-run `EXPO_PUBLIC_DEMO_URL=<url-vercel> pnpm run generate:qr` if the Vercel URL differs from `https://zentia.vercel.app`
- [ ] Manual physical test on Expo Go (iOS / Android) for Face ID / Fingerprint biometric lock (`expo-local-authentication`) and concurrent sync with browser
