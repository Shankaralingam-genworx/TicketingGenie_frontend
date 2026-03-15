import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppDispatch';
import type { UserRole } from '@/types';

export const ROLE_HOME: Record<UserRole, string> = {
  admin:         '/admin',
  team_lead:     '/lead',
  support_agent: '/agent',
  customer:      '/customer',
};

export const GuestGuard: React.FC = () => {
  const { isAuthenticated, isBootstrapping, user } = useAppSelector((s) => s.auth);
  if (isBootstrapping) return <div>Loading...</div>;
  if (isAuthenticated && user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
};

export const AuthGuard: React.FC<{ allowedRoles?: UserRole[] }> = ({ allowedRoles }) => {
  const { isAuthenticated, isBootstrapping, user } = useAppSelector((s) => s.auth);
  if (isBootstrapping) return <div>Loading...</div>;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
};
