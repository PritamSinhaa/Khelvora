import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const output = resolve("dist");
const manifest = JSON.parse(await readFile(resolve(output, "manifest.webmanifest"), "utf8"));
assert.equal(manifest.start_url, "/discover");
assert.equal(manifest.scope, "/");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.theme_color, "#07141e");
assert.equal(manifest.background_color, "#07141e");
assert.equal(manifest.icons.length >= 2, true);
for (const icon of manifest.icons) {
  const file = resolve(output, icon.src.slice(1));
  const buffer = await readFile(file);
  assert.equal(buffer.toString("hex", 0, 8), "89504e470d0a1a0a");
  assert.equal(buffer.readUInt32BE(16), Number(icon.sizes.split("x")[0]));
  assert.equal(buffer.readUInt32BE(20), Number(icon.sizes.split("x")[1]));
}
assert.equal((await stat(resolve(output, "offline.html"))).isFile(), true);

const html = await readFile(resolve(output, "index.html"), "utf8");
assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
assert.match(html, /apple-touch-icon\.png/);
const clientRegistration = await readFile(resolve("src/components/pwa/PwaStatus.jsx"), "utf8");
assert.match(clientRegistration, /serviceWorker\.register\("\/sw\.js",\s*\{\s*scope:\s*"\/"/);
const workerSource = await readFile(resolve(output, "sw.js"), "utf8");
assert.match(workerSource, /KHELVORA_SKIP_WAITING/);
assert.match(workerSource, /request\.mode === "navigate"/);
assert.match(workerSource, /request\.method !== "GET"/);
assert.match(workerSource, /url\.origin !== self\.location\.origin/);
assert.match(workerSource, /STATIC_PATHS\.has\(url\.pathname\)/);
assert.doesNotMatch(workerSource, /\/api\/v1|socket\.io|Authorization|sessionStorage/);
const urls = JSON.parse(workerSource.match(/const STATIC_URLS = (\[[^;]+\]);/)[1]);
assert.ok(urls.includes("/offline.html"));
assert.ok(urls.some((url) => /^\/assets\/.+\.(js|css)$/.test(url)));
for (const url of urls) assert.equal((await stat(resolve(output, url.slice(1)))).isFile(), true, `${url} must exist in build output`);

const handlers = new Map();
const store = new Map();
const normalize = (key) => new URL(typeof key === "string" ? key : key.url, "https://khelvora.test").pathname;
class TestCache {
  constructor() { this.items = new Map(); }
  async addAll(paths) {
    for (const path of paths) {
      const pathname = normalize(path);
      const body = pathname === "/offline.html"
        ? await readFile(resolve(output, "offline.html"), "utf8")
        : `cached:${pathname}`;
      this.items.set(pathname, new Response(body));
    }
  }
  async match(key) { return this.items.get(normalize(key))?.clone(); }
  async put(key, value) { this.items.set(normalize(key), value.clone()); }
}
const cacheApi = {
  async open(name) { if (!store.has(name)) store.set(name, new TestCache()); return store.get(name); },
  async keys() { return [...store.keys()]; },
  async delete(name) { return store.delete(name); },
};
let skipWaitingCount = 0;
let claimCount = 0;
const self = {
  location: { origin: "https://khelvora.test" },
  clients: { async claim() { claimCount += 1; } },
  skipWaiting() { skipWaitingCount += 1; },
  addEventListener(name, callback) { handlers.set(name, callback); },
};
let networkOffline = false;
const workerFetch = async (request) => {
  if (networkOffline) throw new TypeError("offline");
  return new Response(`network:${request.url}`, { status: 200 });
};
vm.runInNewContext(workerSource, { self, caches: cacheApi, URL, Response, Set, Promise, fetch: workerFetch });

const installEvent = { waitUntil(promise) { this.promise = promise; } };
handlers.get("install")(installEvent);
await installEvent.promise;
assert.equal(skipWaitingCount, 0, "updates must wait for the user's choice");
const currentName = (await cacheApi.keys()).find((name) => name.startsWith("khelvora-static-"));
assert.ok(currentName);
const currentCache = await cacheApi.open(currentName);
assert.ok(await currentCache.match("/offline.html"));
const assetPath = urls.find((url) => url.startsWith("/assets/") && /\.js$/.test(url));
assert.ok(await currentCache.match(assetPath));

async function dispatchFetch({ path, mode = "no-cors", method = "GET" }) {
  const event = {
    request: { url: `https://khelvora.test${path}`, mode, method },
    respondWith(promise) { this.response = promise; },
  };
  handlers.get("fetch")(event);
  return event.response ? event.response : null;
}
assert.equal(await dispatchFetch({ path: "/api/v1/users/me" }), null, "private API responses must bypass cache interception");
assert.equal(await dispatchFetch({ path: "/socket.io/?EIO=4&transport=polling" }), null, "Socket.IO must bypass cache interception");
assert.equal(await dispatchFetch({ path: "/api/v1/open-games/one/join", method: "POST" }), null, "offline mutations must not be queued");
networkOffline = false;
const deepLink = await dispatchFetch({ path: "/matches/example", mode: "navigate" });
assert.match(await deepLink.text(), /^network:/, "online SPA deep links go to the host rewrite");
networkOffline = true;
const fallback = await dispatchFetch({ path: "/matches/example", mode: "navigate" });
assert.match(await fallback.text(), /You're offline/);
const offlineAsset = await dispatchFetch({ path: assetPath });
assert.match(await offlineAsset.text(), /^cached:/);

const messageEvent = { data: "KHELVORA_SKIP_WAITING" };
handlers.get("message")(messageEvent);
assert.equal(skipWaitingCount, 1, "the update message is the only skip-waiting path");
await cacheApi.open("khelvora-static-00000000-older");
await cacheApi.open("khelvora-static-00000001-older");
const activateEvent = { waitUntil(promise) { this.promise = promise; } };
handlers.get("activate")(activateEvent);
await activateEvent.promise;
const retained = await cacheApi.keys();
assert.equal(claimCount, 1);
assert.equal(retained.filter((name) => name.startsWith("khelvora-static-")).length, 2, "retain current and previous version caches");
console.log("PWA build artifacts and service-worker behavior verified.");
