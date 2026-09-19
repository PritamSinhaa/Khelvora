import { createContext, useContext } from "react";

export const LiveContext = createContext(false);
export const useLive = () => useContext(LiveContext);