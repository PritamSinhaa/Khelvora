import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { api, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, updateToken] = useState(getToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  function clearSession() {
    setToken("");
    updateToken("");
    setUser(null);
    setLoading(false);
    setError("");
  }

  useEffect(() => {
    const clear = () => clearSession();

    window.addEventListener("khelvora:unauthorized", clear);

    return () => {
      window.removeEventListener("khelvora:unauthorized", clear);
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let active = true;
    const controller = new AbortController();

    setLoading(true);
    setError("");

    api.get("/users/me", { signal: controller.signal })
      .then((data) => {
        if (active) setUser(data.user || data);
      })
      .catch((err) => {
        if (active && err.name !== "AbortError" && err.status !== 401) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, attempt]);

  async function authenticate(mode, values) {
    const data = await api.post(`/auth/${mode}`, values, {
      auth: false,
    });

    if (!data?.accessToken || !data?.user) {
      throw new Error("The authentication response is missing user data.");
    }

    setToken(data.accessToken);
    updateToken(data.accessToken);
    setUser(data.user);
    setError("");

    return data.user;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
    }
  }

  async function refreshUser() {
    const data = await api.get("/users/me");
    setUser(data.user || data);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        authenticate,
        logout,
        clearSession,
        refreshUser,
        retry: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}