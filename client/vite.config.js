import { defineConfig, loadEnv } from "vite";
import { createHash } from "node:crypto";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function serviceWorkerPlugin() {
  return {
    name: "khelvora-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      const assetPaths = Object.keys(bundle)
        .filter((name) => name.startsWith("assets/") && /\.(?:js|css|woff2?|ttf|otf|svg|png|webp)$/.test(name))
        .sort()
        .map((name) => `/${name}`);
      const fingerprint = createHash("sha256")
        .update(assetPaths.join("\n"))
        .digest("hex")
        .slice(0, 10);
      const buildTime = Date.now().toString(36);
      const cacheName = `khelvora-static-${buildTime}-${fingerprint}`;
      const staticUrls = [
        ...assetPaths,
        "/manifest.webmanifest",
        "/offline.html",
        "/icons/khelvora.svg",
        "/icons/khelvora-192.png",
        "/icons/khelvora-512.png",
        "/icons/apple-touch-icon.png",
      ];
      const source = `
const CACHE_NAME = ${JSON.stringify(cacheName)};
const CACHE_PREFIX = "khelvora-static-";
const STATIC_URLS = ${JSON.stringify(staticUrls)};
const STATIC_PATHS = new Set(STATIC_URLS);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const versions = (await caches.keys())
      .filter((name) => name.startsWith(CACHE_PREFIX))
      .sort()
      .reverse();
    await Promise.all(versions.slice(2).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "KHELVORA_SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const fallback = await cache.match("/offline.html");
      return fallback || Response.error();
    }));
    return;
  }

  if (!STATIC_PATHS.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url.pathname);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(url.pathname, response.clone());
    }
    return response;
  })());
});
`;
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL;

  if (mode === "production" && !apiUrl) {
    throw new Error(
      "Set VITE_API_URL to the deployed backend API URL before building.",
    );
  }

  return {
    plugins: [react(), tailwindcss(), serviceWorkerPlugin()],
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
