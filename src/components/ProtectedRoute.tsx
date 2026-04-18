import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, user must have this role to access the route */
  requiredRole?: "user" | "veterinaire" | "association" | "admin";
  /** Redirect destination if not authenticated (default: /auth) */
  redirectTo?: string;
}

/**
 * Wraps a route so it's only accessible to authenticated users
 * (and optionally only to users with a specific role).
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = "/auth",
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still loading session — don't flash a redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in → send to auth, preserving intended destination
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const role: string = user.user_metadata?.role ?? "user";

  // Admins can access any protected route
  if (role === "admin") {
    return <>{children}</>;
  }

  // Wrong role → redirect to home with a clear message stored in state
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" state={{ unauthorized: true, requiredRole }} replace />;
  }

  return <>{children}</>;
};