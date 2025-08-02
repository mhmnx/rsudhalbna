// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Definisikan tipe untuk data user di dalam token
interface User {
  user_id: number;
  nama_lengkap: string;
  nip: string;
  email: string;
  role: 'PEGAWAI' | 'ATASAN' | 'ADMIN';
  // TAMBAHKAN PROPERTI DI BAWAH INI
  unit_kerja: {
      nama_unit: string;
  } | null;
}


// Definisikan tipe untuk value yang disediakan oleh context
interface AuthContextType {
  user: User | null;
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Cek token saat aplikasi pertama kali dimuat
    const token = localStorage.getItem('access_token');
    if (token) {
      const decodedUser: User = jwtDecode(token);
      setUser(decodedUser);
    }
  }, []);

  const login = (accessToken: string) => {
    const decodedUser: User = jwtDecode(accessToken);
    localStorage.setItem('access_token', accessToken);
    setUser(decodedUser);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook kustom untuk mempermudah penggunaan context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}