import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import Providers from "./app/providers";
import "./styles/globals.css";

async function removePreviousInstallSupport() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  const ownedRegistrations = registrations.filter((registration) =>
    [registration.active, registration.waiting, registration.installing]
      .filter(Boolean)
      .some((worker) => {
        const script = new URL(worker.scriptURL);
        return script.origin === window.location.origin && script.pathname === "/sw.js";
      }),
  );

  await Promise.all(ownedRegistrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const names = await window.caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith("khelvora-static-"))
      .map((name) => window.caches.delete(name)));
  }
}

void removePreviousInstallSupport().catch(() => {});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
);
