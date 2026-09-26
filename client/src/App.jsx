import AppRoutes from "./routes/router";
import PwaStatus from "./components/pwa/PwaStatus";

export default function App() {
  return <>
    <PwaStatus />
    <AppRoutes />
  </>;
}
