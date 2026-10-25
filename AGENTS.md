This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Design System & UI Tokens (Figma Specification)

Extracted from the official Zentia Figma design system (`https://www.figma.com/design/im8AtTHFtjjlwwfTw0QvJH/Zentia`):

### 1. Color Palette (Dark Minimalist / Financial OLED)
* **Background Canvas**: `#000000` (Pure Black / Deep AMOLED).
* **Surface Card**: `#121214` to `#18181B` (Zinc 900 / Charcoal elevation for cards and onboarding sheets).
* **Surface Secondary / Inputs**: `#27272A` (Zinc 800 for inputs, selectors, and inactive progress bars).
* **Primary Accent (Financial Health / Success)**: `#22C55E` (Emerald Green for active progress segments, success checks, and positive balance indicators).
* **Text Primary**: `#FFFFFF` (Headings, monetary values, brand header).
* **Text Secondary / Muted**: `#A1A1AA` (Zinc 400 for subtitles, helper copy, step counters).
* **Text Accent / Links**: `#EAB308` or `#22C55E` for legal & terms links.
* **Primary Button (Light Pill)**:
  * Background: `#EDEDED` or `#F4F4F5` (Off-white / Zinc 100).
  * Text: `#09090B` (Dark black/zinc, uppercase, bold, `tracking-wider`).
  * Shape: `rounded-full` (Full pill radius `h-14` or `py-4`).
* **Google Auth Button**:
  * Background: `#FFFFFF`.
  * Text: `#18181B` (`font-medium`).
  * Shape: `rounded-full` with official Google 'G' glyph.

### 2. Typography & Brand Guidelines
* **Font Family**: Geometric Sans-Serif (`Inter`, `SF Pro Display`, `System`).
* **Brand Header**: `"Z E N T I A"` in uppercase with wide letter-spacing (`tracking-[0.25em]` or `tracking-widest`, `font-bold`, `text-white`).
* **Display Titles**: `text-2xl` to `text-3xl`, `font-bold`, `text-white`.
* **Section Headers**: `text-lg font-semibold text-white`.
* **Body / Subtitles**: `text-sm text-zinc-400 font-normal leading-relaxed`.
* **Monetary Displays**: Large tabular figures (e.g., `text-2xl font-bold text-white tracking-tight`).

### 3. Key UI Patterns
* **Bottom Pinned Action**: Primary CTA button always anchored at the bottom with safe area insets (`pb-6`).
* **Multi-Step Segmented Bar**: 3-segment progress indicator for onboarding (`h-1 rounded-full`, active segments `#22C55E`, inactive `#27272A`).
* **Currency Card Input**: Dark `#27272A` container with centered or aligned `$ XX,XXX.XX` monetary mask.
* **Status Badges & Checkmarks**: Rounded circular badges with `#22C55E` icons for success states.

