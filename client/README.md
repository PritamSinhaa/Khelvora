# Khelvora frontend

React single-page app built with Vite.

## Deploy to Render

Create a **Static Site** from this repository with Node.js 24 and set:

- **Branch:** `main`
- **Root Directory:** `client`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`

Set `VITE_API_URL` in the Render service's Environment settings to the deployed backend API URL, including `/api/v1`, for example `https://your-api.onrender.com/api/v1`. Set `VITE_GOOGLE_CLIENT_ID` to your Google Cloud OAuth **Web application** client ID. Add your local and deployed frontend origins to its Authorized JavaScript origins. The client ID is public; never put secrets in `VITE_*` variables. `VITE_SOCKET_URL` is optional; the app derives the socket origin from `VITE_API_URL` when it is not set.

In the static site's **Redirects/Rewrites** settings, add this SPA fallback:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | Rewrite |

This lets React Router serve nested pages on direct visits and refreshes. Once Render assigns the frontend URL, update the backend's `CLIENT_ORIGIN` environment variable to that exact origin and redeploy the backend.

For local development, copy `.env.example` to `.env`, then run `npm ci` and `npm run dev`.

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` creates the production site in `dist` and requires `VITE_API_URL`.
- `npm run preview` serves the built site locally.

## Progressive web app

The production build publishes `manifest.webmanifest`, the Khelvora icons,
`offline.html`, and a generated root-scoped `sw.js`. Render's existing
`/* -> /index.html` rewrite remains the SPA fallback; static files such as
`/sw.js`, `/manifest.webmanifest`, and `/offline.html` are emitted as real
files and are served before the rewrite. The service worker is registered
only by production builds. It caches the current build's hashed JavaScript,
CSS, and fonts plus public install/offline assets. It does not cache HTML,
API responses, authentication, or user content. Requests outside the explicit
static asset allowlist, including API and Socket.IO traffic, pass straight to
the network. The API also sends `Cache-Control: no-store`, including for
authenticated and sign-in responses, so the browser HTTP cache cannot retain
personal API payloads.

When offline, new navigations show the offline page. It explains that signing
in, matches, messages, and changes need a connection; mutations are never
queued. An update waits until old clients close, or until a user chooses the
visible Update action. That action applies the waiting worker and reloads the
current page; users should save active work first. The worker retains the
current and previous static caches to support older open tabs during an
update. Logging out does not clear these shared public-file caches because no
authenticated or personal response is stored there.

Install prompts vary by browser. The in-app Install button appears when a
browser fires Chromium's `beforeinstallprompt`; iPhone and iPad users see
Safari's Share > Add to Home Screen guidance, and Safari on macOS shows
Share/File > Add to Dock guidance (macOS Sonoma 14 or later). Other browsers may provide
installation only through their own menu, and may not expose a scriptable
install prompt. Installation and service workers require HTTPS, except on
localhost/loopback development origins. See [MDN's installability guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [MDN's install prompt API notes](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event), [Apple's iPhone Safari instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27), and [Apple's Mac Safari instructions](https://support.apple.com/guide/safari/turn-a-website-into-an-app-ibrw9e991864/mac).

After deployment, verify the manifest and icons in the browser's application
panel, install from a supported browser, go offline and open a deep link, then
deploy a second build to check that an update notice waits for user action.
Run `npm run verify:pwa` (with `VITE_API_URL` configured) to validate the built
manifest, icon dimensions, generated worker scope and cache allowlist, and
offline/update routing behavior. Physical iOS
installation, browser-specific install UI, and update behavior with real open
forms still need manual testing on target devices and browsers.
