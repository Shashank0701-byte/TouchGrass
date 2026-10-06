# TouchGrass AI

TouchGrass is an offline-first outdoor quest companion. Prepare a short quest with open-weight AI, save it to this device, and take it outside without relying on a connection.

## Current build phase

**Phase 2 — quest generation:** choose a duration, activity, and difficulty; ask a local Ollama model for a structured quest; review the tasks; and keep it in IndexedDB. New quests are retained as local drafts immediately, appear on Home, and can be marked ready for offline. A safe on-device fallback is available if Ollama cannot generate a valid quest. Quest progress and the timer arrive in the next phase.

## Run locally

1. Install and start [Ollama](https://ollama.com/download).
2. Make sure the configured model is available. This workspace currently uses `qwen2.5-coder:7b`, which is already installed here. For a fresh setup:

   ```bash
   ollama pull qwen2.5-coder:7b
   ```

3. Copy `.env.example` to `.env.local` if you want to change the model or Ollama address.
4. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). The app server must run on the same computer as Ollama for generation; quest data stays in the browser. The browser talks to the same-origin `/api/quests` route, which calls Ollama on `127.0.0.1:11434`, so browser CORS settings are not needed.

## Local data and offline behavior

- Prepared quests, results, stats, and photo evidence are stored in IndexedDB through Dexie.
- The service worker caches the app shell, its built assets, and a small offline fallback. It does not store quest records or photos in Cache Storage.
- The prepared quest can be made without a model through the on-device fallback. The complete offline quest experience is still being built.
- No account or cloud database is part of the MVP.

## Stack

- Next.js App Router and React
- TypeScript and Tailwind CSS
- Dexie over IndexedDB
- Ollama with an open-weight local model

See [the product requirements](docs/PRD%20(5).md) for the product scope and demo loop.
