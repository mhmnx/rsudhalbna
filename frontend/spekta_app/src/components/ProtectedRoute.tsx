// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import React from 'react'; // Impor React

// Definisikan tipe untuk props
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>; // Bungkus children dengan Fragment jika perlu
}