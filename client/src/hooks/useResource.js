import { useCallback, useEffect, useRef, useState } from "react";
import { api, getToken } from "../lib/api";

export function useResource(path, { interval = 0 } = {}) {
  const [state, setState] = useState({
    key: null, data: null, loading: false, error: "",
  });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const sequence = useRef(0);
  const key = path ? `${getToken()}:${path}` : null;
  const requestKey = `${key}:${version}`;

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const current = ++sequence.current;

    api.get(path, { signal: controller.signal })
      .then((data) => {
        if (current === sequence.current && !controller.signal.aborted) {
          setState({ key, requestKey, data, loading: false, error: "" });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && current === sequence.current) {
          setState((previous) => ({
            key,
            requestKey,
            data: previous.key === key ? previous.data : null,
            loading: false,
            error: error.message,
          }));
        }
      });

    return () => controller.abort();
  }, [path, key, requestKey]);

  useEffect(() => {
    const update = () => {
      if (!document.hidden) reload();
    };
    window.addEventListener("khelvora:data", reload);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    const timer = interval && path ? setInterval(update, interval) : null;

    return () => {
      window.removeEventListener("khelvora:data", reload);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      if (timer) clearInterval(timer);
    };
  }, [reload, interval, path]);

  if (!path) return { data: null, error: "", loading: false, reload };

  return {
    ...(state.requestKey === requestKey
      ? state
      : {
          data: state.key === key ? state.data : null,
          loading: true,
          error: "",
        }),
    reload,
  };
}

export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  async function run(action) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");

    try {
      return await action();
    } catch (failure) {
      setError(failure.message || "Something went wrong. Please try again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return { busy, error, run, setError };
}