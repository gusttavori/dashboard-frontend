import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login';
import Cadastro from './Cadastro';
import App from './App';
import AdminImoveis from './AdminImoveis';
import EditarImovel from './EditarImovel';
import PrivateRoute from './privateRoutes';

const MainRouter = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminImoveis />
            </PrivateRoute>
          }
        />

        {/* --- CORREÇÃO APLICADA AQUI --- */}
        {/* A rota de edição agora também está protegida, garantindo consistência. */}
        <Route
          path="/admin/editar/:id"
          element={
            <PrivateRoute>
              <EditarImovel />
            </PrivateRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default MainRouter;
