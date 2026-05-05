import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, AppRole } from "@/contexts/AuthContext";

export const ProtectedRoute = ({
  children,
  allow,
}: {
  children: ReactNode;
  allow: AppRole[];
}) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!role || !allow.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};
