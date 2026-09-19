import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_URL } from "../lib/api";

const LiveContext = createContext({
  revision: 0,
  connected: false,
});

export function LiveProvider({ children }) {
  const { token } = useAuth();
  const [revision, setRevision] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(false);

    if (!token) return;

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || new URL(API_URL).origin,
      {
        auth: { token },
      },
    );

    let timer;

    const refresh = () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        setRevision((value) => value + 1);
      }, 120);
    };

    socket.on("connect", () => {
      setConnected(true);
      refresh();
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.onAny(refresh);

    return () => {
      clearTimeout(timer);
      socket.offAny(refresh);
      socket.disconnect();
    };
  }, [token]);

  return (
    <LiveContext.Provider value={{ revision, connected }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  return useContext(LiveContext);
}