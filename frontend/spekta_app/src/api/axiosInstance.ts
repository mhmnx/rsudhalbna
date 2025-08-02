// src/api/axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1/`,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor untuk menambahkan token ke setiap request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- TAMBAHKAN BLOK BARU DI BAWAH INI ---

// Response interceptor untuk menangani error 401 (Unauthorized)
axiosInstance.interceptors.response.use(
    // Loloskan response yang sukses (status 2xx)
    (response) => {
        return response;
    },
    // Tangani response yang error
    (error) => {
        // Cek jika error disebabkan oleh status 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Hapus token dari localStorage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Arahkan (redirect) ke halaman login
            // Menggunakan window.location.href akan me-refresh halaman,
            // yang efektif untuk membersihkan state aplikasi.
            window.location.href = '/login';
        }
        
        // Lanjutkan error ke .catch() selanjutnya jika ada
        return Promise.reject(error);
    }
);


export default axiosInstance;