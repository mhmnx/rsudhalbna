// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
// 1. Impor CSS Mantine
import '@mantine/core/styles.css';

// 2. Impor Provider dan fungsi untuk membuat tema
import { MantineProvider, createTheme } from '@mantine/core';

import { BrowserRouter } from 'react-router-dom'

// 3. Buat tema kustom kita
const theme = createTheme({
  // UBAH BARIS INI
  fontFamily: 'Open Sans, sans-serif',
  primaryColor: 'blue',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider theme={theme}>
        {/* Bungkus App dengan AuthProvider */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>,
);