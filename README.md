# ICM Connected

This repository joins the existing Islamic Center of Morrisville website and the latest pushed Expo mobile app through one shared backend and CMS. The original layouts, icons, and navigation are preserved.

## Source versions

- Website: `icm-3/icmwebsite`, commit `78f6e000ae0ca8f9eafcf536f7fadb1ba5b66c25` (latest `main` push on August 7, 2026)
- Mobile app: `kamilawan38-debug/icm-mobile-companion-qibla`, commit `09cd28f4ca59fc09f251098c3a7f40d3ccb54b79` (`codex/add-poster-news-detail`)
- Connected work: branch `feature/shared-backend-cms`

The mobile app keeps that original UI and is upgraded in place to Expo SDK 57 so it opens in the current iOS Expo Go app.

## Backend

The backend is a small Node.js HTTP server with a SQLite database. It has no separate database service to install for local use. SQLite stores drafts, published content, revision history, administrators, sessions, cached WordPress schedules, prayer correction proposals, and uploaded images in `runtime/icm.sqlite`.

This is straightforward for local use or a single persistent server. Do not deploy the SQLite file to an ephemeral serverless filesystem. A production host must provide persistent disk and backups, or the storage adapter should be moved to a managed PostgreSQL service before launch.

## What is shared

- Newsletters and announcements
- Events and programs
- Jummah schedule
- Donation and site settings
- Media uploads
- Drafts, publishing, revisions, and restore history

Prayer times continue to come from ICM's existing WordPress Daily Prayer Time feed. The backend validates and caches complete monthly schedules, then serves the same verified data to the website and app. The CMS can refresh the WordPress schedule and record proposed changes; WordPress remains the source of truth for prayer-time edits.

## CMS workflow

Open `/admin`, sign in, and choose a section from the left navigation. The CMS provides:

- Separate editors for newsletters/news, Jumu'ah, events, programs, contact links, and prayer schedules
- Image upload and current-image previews
- Plain-language required fields and validation
- Move up/down controls for public ordering
- Confirmation before removing an item
- A visible unsaved-changes state
- Save Draft without changing public content
- Publish to Website + App with one button
- Revision history and restore-to-draft
- Official WordPress prayer sync and correction-proposal export

ICM's public newsletter link is a Constant Contact signup page, not a public issue feed. Keep that permanent signup URL under **Contact & links**. For each new weekly issue, choose **Add newsletter**, paste the issue's public Constant Contact link, add the headline/summary/article, and publish once; the issue then appears in both the website and app. Automatic issue import would require ICM's Constant Contact account/API access.

## Run locally

Install and run the website, backend, and CMS:

```powershell
npm ci
npm run start:lan
```

The website is at `http://localhost:4180/` and the CMS is at `http://localhost:4180/admin`.

Create the first CMS administrator:

```powershell
$env:ICM_ADMIN_USERNAME='admin'
$env:ICM_ADMIN_PASSWORD='your-password'
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

The project manifest should report `runtimeVersion: exposdk:57.0.0`. If Expo Go has cached the old SDK 54 project, close that project in Expo Go and scan the new QR code from this server.

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
