import { AuthProvider } from "../features/auth/AuthProvider";
import { LiveProvider } from "../features/messaging/LiveProvider";
import { ErrorBoundary } from "../components/ui/Feedback";

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LiveProvider>{children}</LiveProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}