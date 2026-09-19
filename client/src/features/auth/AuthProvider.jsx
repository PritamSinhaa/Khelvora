import { useEffect, useState } from "react";

import { api, getToken, setToken } from "../../lib/api";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }) {
  const [token, updateToken] = useState(getToken);
  const [version, setVersion] = useState(0);
  const [logoutWarning, setLogoutWarning] = useState("");

  const [account, setAccount] = useState({
    key: null,
    user: null,
    error: "",
  });

  const key = `${token}:${version}`;

  const loading = Boolean(token) && account.key !== key;
  const user = account.key === key ? account.user : null;
  const error = account.key === key ? account.error : "";

  function clearSession() {
    setToken();
    updateToken("");
    setAccount({
      key: null,
      user: null,
      error: "",
    });
  }

  useEffect(() => {
    function handleUnauthorized() {
      updateToken("");
      setAccount({
        key: null,
        user: null,
        error: "",
      });
    }

    window.addEventListener(
      "khelvora:unauthorized",
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        "khelvora:unauthorized",
        handleUnauthorized,
      );
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    api
      .get("/users/me", { signal: controller.signal })
      .then((currentUser) => {
        if (controller.signal.aborted) return;

        setAccount({
          key,
          user: currentUser,
          error: "",
        });
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;

        setAccount({
          key,
          user: null,
          error: failure.message,
        });
      });

    return () => controller.abort();
  }, [token, key]);

  async function signIn(mode, values) {
    const session = await api.post(
      `/auth/${mode}`,
      values,
      { auth: false },
    );

    if (!session?.accessToken || !session?.user) {
      throw new Error("The server did not return a valid session.");
    }

    setLogoutWarning("");
    setToken(session.accessToken);
    updateToken(session.accessToken);
  }

  async function refreshUser() {
    const currentUser = await api.get("/users/me");

    setAccount({
      key,
      user: currentUser,
      error: "",
    });

    return currentUser;
  }

  async function logout() {
    setLogoutWarning("");

    try {
      await api.post("/auth/logout");
    } catch {
      setLogoutWarning(
        "You are signed out of this browser session, but server-side " +
          "sign-out could not be confirmed. Other sessions may still " +
          "be active. Sign in and try again when the server is available.",
      );
    } finally {
      clearSession();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        logoutWarning,
        signIn,
        refreshUser,
        logout,
        clearSession,
        retry: () => setVersion((value) => value + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}