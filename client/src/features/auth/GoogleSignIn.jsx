import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const scriptUrl = "https://accounts.google.com/gsi/client";

export default function GoogleSignIn() {
  const auth = useAuth();
  const buttonRef = useRef(null);
  const signInRef = useRef(auth.signIn);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  signInRef.current = auth.signIn;

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;
    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setError("");
          setLoading(true);
          try {
            await signInRef.current("google", { credential });
          } catch (failure) {
            setError(failure.message || "Google sign-in failed. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.min(buttonRef.current.clientWidth, 360),
      });
    };

    if (window.google?.accounts?.id) {
      render();
    } else {
      let script = document.querySelector(`script[src="${scriptUrl}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      script.addEventListener("error", () => {
        if (!cancelled) setError("Google sign-in could not load. Please try again.");
      }, { once: true });
    }

    return () => { cancelled = true; };
  }, []);

  if (!clientId) {
    return <p className="text-sm text-muted">Google sign-in is not configured.</p>;
  }

  return (
    <div className="stack">
      <div ref={buttonRef} className="min-h-10" />
      {loading && <p role="status" className="text-sm text-muted">Signing in with Google…</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
