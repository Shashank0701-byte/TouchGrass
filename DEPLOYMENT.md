# Deploy TouchGrass AI

This guide prepares the public demo on Vercel. Next.js is detected automatically, so no custom build or output settings are needed.

## What the hosted demo does

- The site, Home shell, quest sessions, IndexedDB progress, and offline support run on the deployed origin.
- Quest generation can use Ollama's hosted API from a server-side Vercel function. The API key stays in Vercel's server environment and is never sent to the browser.
- If hosted Ollama is not configured or temporarily fails, quest generation falls back to a ready-made quest.
- Data is per browser origin. Quests and photos saved at `localhost` do not automatically appear on the deployed domain, and vice versa.
- Quest records, XP, streaks, and photo evidence stay in the browser's IndexedDB. The service worker caches the app shell and static assets, not personal quest or photo data.

## Deploy from GitHub

1. Open the [Vercel project import page](https://vercel.com/new) and import `Shashank0701-byte/TouchGrass` from GitHub.
2. Keep the detected Next.js framework and default build settings (`npm run build`). No custom output directory is required.
3. In **Settings > Environment Variables**, add these values for **Production** and **Preview**:

   | Name | Value |
   | --- | --- |
   | `OLLAMA_BASE_URL` | `https://ollama.com` |
   | `OLLAMA_MODEL` | Your Ollama cloud model ID, for example `gemma4:31b-cloud` |
   | `OLLAMA_API_KEY` | The API key from your Ollama account (mark it sensitive/encrypted) |
   | `OLLAMA_ENABLED` | `true` |

   `OLLAMA_API_KEY` is read only by the server route. Never prefix it with `NEXT_PUBLIC_`, commit it, or put it in client-side code. Keep the model ID aligned with a model available to your Ollama account. The project calls Ollama's native `/api/chat` endpoint.
4. Deploy the `main` branch. Vercel will provide an HTTPS `vercel.app` URL. Redeploy after changing environment variables.

To host a fallback-only demo instead, set `OLLAMA_ENABLED=false` and omit the other three values. Ollama usage may be subject to account limits or charges; check the current Ollama plan before sharing a public deployment.

Vercel's free Hobby plan is limited to personal, non-commercial use. Check the current [Hobby plan terms](https://vercel.com/docs/plans/hobby) before using it for anything commercial.

## Check the offline demo

1. Open the deployed Home page while online and wait for it to finish loading.
2. Reload once so the newly installed service worker controls the page.
3. Create or open a quest, then use the browser's offline mode and reload Home.
4. Confirm saved quests, task progress, the timer, XP, history, and locally stored photo evidence are available.

The service worker is intentionally disabled by `npm run dev`. To check the same behavior locally, use `npm run build` followed by `npm start`.
