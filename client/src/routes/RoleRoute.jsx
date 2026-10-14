import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLoadingScreen from '../components/ui/AuthLoadingScreen';

export const RoleRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen message="Checking permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role || 'employee';

  if (!allowedRoles.includes(role)) {
    // Redirect to the user's appropriate default dashboard based on their role
    switch (role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'trainer':
        return <Navigate to="/trainer/dashboard" replace />;
      case 'employee':
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default RoleRoute;
