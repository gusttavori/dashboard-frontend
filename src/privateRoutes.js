import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const usuarioLogado = localStorage.getItem('token');
  console.log(usuarioLogado);

  return usuarioLogado ? children : <Navigate to="/login" />;
}
