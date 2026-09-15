import { Navigate, Outlet } from "react-router-dom";
import { getSession } from "../auth";

export default function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && session.user.role !== "admin") return <Navigate to="/Hotelstaffdashboard" replace />;
  return <Outlet />;
}
