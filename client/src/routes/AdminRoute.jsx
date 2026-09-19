import { Navigate, Outlet } from "react-router";
import { useAuth } from "../features/auth/useAuth";

export default function AdminRoute() {
  const { user } = useAuth();

  return user?.role === "admin"
    ? <Outlet />
    : <Navigate to="/discover" replace />;
}