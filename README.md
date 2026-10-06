# TouchGrass AI

TouchGrass is an offline-first outdoor quest companion. Prepare a short quest with open-weight AI, save it to this device, and take it outside without relying on a connection.

## Current build phase

**Phase 1 — foundation:** responsive Next.js app shell, installable PWA metadata, a small versioned service worker, and the initial IndexedDB schema. Quest generation and progress arrive in the next phases.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The service worker is enabled in production builds; it is intentionally not registered in development so it cannot interfere with hot reload.

## Local data and offline behavior

- Quest records, results, stats, and photo evidence are designed for IndexedDB through Dexie.
- The service worker caches the app shell, its built assets, and a small offline fallback. It does not store quest records or photos in Cache Storage.
- The first full offline quest flow is still being built. Use a production build over HTTPS (or `localhost`) when trying PWA installation.
- No account or cloud database is part of the MVP.

## Stack

- Next.js App Router and React
- TypeScript and Tailwind CSS
- Dexie over IndexedDB
- A local Ollama model for quest preparation (planned)

See [the product requirements](docs/PRD%20(5).md) for the product scope and demo loop.
