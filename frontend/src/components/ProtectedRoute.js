import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a page and redirects away if the user isn't logged in, or isn't one
 * of the allowed roles. `redirectTo` lets each surface (citizen/officer/admin)
 * send unauthorized visitors somewhere sensible instead of a shared login page,
 * which also keeps the admin surface from advertising its own login route.
 */
export default function ProtectedRoute({ children, allow, redirectTo = '/' }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="container" style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to={redirectTo} replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to={redirectTo} replace />;

  return children;
}
