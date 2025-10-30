import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom'; // Import Navigate
import { useAuth } from '../context/AuthContext';
import ChangePasswordDialog from './dialogs/ChangePasswordDialog';
import { FallbackCustom } from './ui/FallbackCustom';
import LoginDialog from './dialogs/LoginDialog';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth(); // Destructure logout
  const location = useLocation();

  if (isLoading) {
    return <FallbackCustom text="Cargando" />;
  }

  if (!user) {
    return <LoginDialog open={true} onOpenChange={() => {}} />;
  }

  if (user.mustChangePassword) {
    return <ChangePasswordDialog open={true} onOpenChange={() => {}} isForcedChange={true} />;
  }

  // Redireccionar a la ruta principal /pallets si intentan acceder a la raíz
  if (location.pathname === '/') {
    return <Navigate to="/pallets" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;