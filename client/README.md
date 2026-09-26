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
