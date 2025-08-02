// src/api/atasanService.ts
import axiosInstance from './axiosInstance';

export interface BawahanDashboard {
    id: number;
    nama_lengkap_gelar: string;
    nip: string;
    jabatan: { nama_jabatan: string } | null;
    skp_aktif_status: string;
    skp_aktif_id: number | null;
    periode_dinilai_count: number;
    total_periode_count: number;
    periode_penilaian_bulan_ini: string;
}

export const fetchAtasanDashboardData = async (): Promise<BawahanDashboard[]> => {
    const response = await axiosInstance.get('/atasan/kinerja/dashboard-data/');
    return response.data;
};