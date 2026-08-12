# Ustaxona — Android APK ga tayyor loyiha

Bu loyiha React + Vite + Capacitor asosida Android APK build qilishga tayyor.

## GitHub orqali APK olish
1. Shu loyihani GitHub repository'ga yuklang.
2. `main` branch'ga push qiling.
3. GitHub'da **Actions** → **Build Android APK** ni oching.
4. Workflow tugagach, **Artifacts** ichidan `ustaxona-debug-apk` ni yuklab oling.
5. ZIP ichidagi `app-debug.apk` faylini telefonga yuboring va o'rnating.

## Lokal build
```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

APK:
`android/app/build/outputs/apk/debug/app-debug.apk`
