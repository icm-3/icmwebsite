# ICM Connected

This repository joins the existing Islamic Center of Morrisville website and the latest pushed Expo mobile app through one shared backend and CMS. The original layouts, icons, and navigation are preserved.

## Source versions

- Website: `kamilawan38-debug/icmwebsite`
- Mobile app: `kamilawan38-debug/icm-mobile-companion-qibla`, commit `09cd28f4ca59fc09f251098c3a7f40d3ccb54b79` (`codex/add-poster-news-detail`)
- Connected work: branch `feature/shared-backend-cms`

## What is shared

- Newsletters and announcements
- Events and programs
- Jummah schedule
- Donation and site settings
- Media uploads
- Drafts, publishing, revisions, and restore history

Prayer times continue to come from ICM's existing WordPress Daily Prayer Time feed. The backend validates and caches complete monthly schedules, then serves the same verified data to the website and app. The CMS can refresh the WordPress schedule and record proposed changes; WordPress remains the source of truth for prayer-time edits.

## Run locally

Install and run the website, backend, and CMS:

```powershell
npm ci
npm run start:lan
```

The website is at `http://localhost:4180/` and the CMS is at `http://localhost:4180/admin`.

Create the first CMS administrator (use a password of at least 14 characters):

```powershell
$env:ICM_ADMIN_USERNAME='admin'
$env:ICM_ADMIN_PASSWORD='replace-with-a-long-password'
npm run admin:create
```

For the separate LAN preview database used by `start:lan`, also set:

```powershell
$env:DB_PATH="$PWD/runtime/icm-preview.sqlite"
```

Run the original mobile app in another terminal:

```powershell
cd mobile-app
npm ci
Copy-Item .env.example .env.local
npx expo start --lan
```

Set `EXPO_PUBLIC_CMS_URL` in `mobile-app/.env.local` to this computer's LAN address, for example `http://192.168.1.80:4180/api/mobile-content`, so Expo Go on a phone can reach the backend.

## Verification

```powershell
npm test
npm run build
cd mobile-app
npx tsc --noEmit
npm run lint
npx expo-doctor
npx expo export --platform web
```
