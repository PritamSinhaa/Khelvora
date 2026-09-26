import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";

function isStandalone() {
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone);
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isMacSafari() {
  return /mac/i.test(navigator.platform || navigator.userAgent)
    && /safari/i.test(navigator.userAgent)
    && !/(chrome|chromium|crios|edg|fxios|opios)/i.test(navigator.userAgent);
}

export default function PwaStatus() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [dismissIOS, setDismissIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const registrationRef = useRef(null);
  const updateTriggered = useRef(false);

  useEffect(() => {
    const checkStandalone = () => setStandalone(isStandalone());
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setShowIOSHelp(false);
      setDismissIOS(true);
      checkStandalone();
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    const displayMode = window.matchMedia?.("(display-mode: standalone)");
    displayMode?.addEventListener?.("change", checkStandalone);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    checkStandalone();

    let updateTimer;
    let alive = true;
    const onControllerChange = () => {
      if (updateTriggered.current) window.location.reload();
    };

    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((activeRegistration) => {
          if (!alive) return;
          registrationRef.current = activeRegistration;
          const checkWaiting = () => {
            if (activeRegistration.waiting && navigator.serviceWorker.controller) setUpdateReady(true);
          };
          checkWaiting();
          activeRegistration.addEventListener("updatefound", () => {
            const installing = activeRegistration.installing;
            installing?.addEventListener("statechange", checkWaiting);
          });
          updateTimer = window.setInterval(() => activeRegistration.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch(() => {});
    }

    return () => {
      alive = false;
      displayMode?.removeEventListener?.("change", checkStandalone);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
      if (updateTimer) window.clearInterval(updateTimer);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
    }
  }

  function applyUpdate() {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) return;
    if (!window.confirm("The page will reload to update. Save any unsent form changes first. Continue?")) return;
    updateTriggered.current = true;
    setApplyingUpdate(true);
    // Reload only after the user chooses the update action.
    waiting.postMessage("KHELVORA_SKIP_WAITING");
  }

  const showManualInstall = !standalone && !installPrompt && !dismissIOS && (isIOS() || isMacSafari());
  if (!offline && !updateReady && !installPrompt && !showManualInstall) return null;

  return <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-xl space-y-2 lg:inset-x-auto lg:right-5 lg:bottom-5">
    {offline && <aside role="status" className="panel row border-amber-300/40 bg-surface shadow-xl">
      <WifiOff size={18} className="shrink-0 text-primary" />
      <p className="flex-1 text-sm">Offline. Sign-in, live data, messages, and changes need a connection. Nothing is queued.</p>
    </aside>}
    {updateReady && <aside role="status" className="panel row border-primary/50 bg-surface shadow-xl">
      <RefreshCw size={18} className="shrink-0 text-primary" />
      <p className="flex-1 text-sm"><strong>Update ready.</strong> Apply it when your current work is saved.</p>
      <button className="btn" disabled={applyingUpdate} onClick={applyUpdate}>{applyingUpdate ? "Updating..." : "Update"}</button>
    </aside>}
    {!standalone && installPrompt && <aside className="panel row border-primary/50 bg-surface shadow-xl">
      <Download size={18} className="shrink-0 text-primary" />
      <p className="flex-1 text-sm">Install Khelvora for quick access.</p>
      <button className="btn" onClick={install}>Install</button>
    </aside>}
    {showManualInstall && <aside className="panel stack border-primary/50 bg-surface shadow-xl">
      <div className="row"><Download size={18} className="shrink-0 text-primary" /><p className="flex-1 text-sm">{isIOS() ? "Add Khelvora to your Home Screen." : "Add Khelvora to your Dock."}</p><button type="button" className="text-muted" aria-label="Dismiss install guidance" onClick={() => setDismissIOS(true)}><X size={18} /></button></div>
      {showIOSHelp ? <p className="text-sm text-muted">{isIOS() ? "In Safari, tap Share, choose Add to Home Screen, turn on Open as Web App, then tap Add." : "On macOS Sonoma 14 or later, choose File > Add to Dock in Safari, or use Share > Add to Dock."}</p> : <button className="btn self-start" onClick={() => setShowIOSHelp(true)}>How to install</button>}
    </aside>}
  </div>;
}
