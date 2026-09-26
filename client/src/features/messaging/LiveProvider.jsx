import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { connectLive } from "../../lib/socket";
import { LiveContext } from "./useLive";

export function LiveProvider({ children }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    let disposed = false;
    let connection;

    connectLive(token, (value) => {
      if (!disposed) setConnected(value);
    }).then((socket) => {
      if (disposed) socket.dispose();
      else connection = socket;
    }).catch(() => {
      if (!disposed) setConnected(false);
    });

    return () => {
      disposed = true;
      connection?.dispose();
      setConnected(false);
    };
  }, [token]);

  return (
    <LiveContext.Provider value={connected}>
      {children}
    </LiveContext.Provider>
  );
}
