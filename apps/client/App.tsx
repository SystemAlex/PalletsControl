import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import ProtectedRoute from './src/components/ProtectedRoute';
import MainLayout from './src/layouts/MainLayout';
import { SpinnerCustom } from './src/components/ui/SpinnerCustom';

const UserManagementPage = lazy(() => import('./src/pages/UserManagementPage'));
const PalletProductsPage = lazy(() => import('./src/pages/PalletProductsPage'));
const EmpresaManagementPage = lazy(() => import('./src/pages/EmpresaManagementPage'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route
              path="/"
              element={<Navigate to="/pallets" replace />} // Redirect root to /pallets
            />
            <Route
              path="/users"
              element={
                <Suspense fallback={<SpinnerCustom text="Cargando Gestión de usuarios" />}>
                  <UserManagementPage />
                </Suspense>
              }
            />
            <Route
              path="/pallets"
              element={
                <Suspense fallback={<SpinnerCustom text="Cargando Control Pallets" />}>
                  <PalletProductsPage />
                </Suspense>
              }
            />
            <Route
              path="/empresas"
              element={
                <Suspense fallback={<SpinnerCustom text="Cargando Gestión de Empresas" />}>
                  <EmpresaManagementPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
