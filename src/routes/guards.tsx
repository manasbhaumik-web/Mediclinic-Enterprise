import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import GlobalSpinner from '../components/ui/GlobalSpinner';

/** Requires a signed-in user with a resolved profile role; otherwise sends them to /login. */
export function RequireAuth() {
  const { role, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <GlobalSpinner />;
  if (!role) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Renders children only when the person holds one of the listed roles; everyone else is sent to `fallback`. */
export function RequireRole({ roles: allowed, fallback = '/app/dashboard', children }: {
  roles: readonly UserRole[];
  fallback?: string;
  children: React.ReactNode;
}) {
  const { roles } = useAuth();
  if (!roles.some((r) => allowed.includes(r))) return <Navigate to={fallback} replace />;
  return <>{children}</>;
}
