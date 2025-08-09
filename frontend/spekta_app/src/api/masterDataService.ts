// src/api/masterDataService.ts
import axiosInstance from './axiosInstance';

export interface MasterPerilaku {
    id: number;
    jenis_perilaku: string;
    uraian_perilaku: string;
}

export interface DashboardStats {
    total_pegawai: number;
    total_skp_tahunan: number;
    total_periode_dibuat: number;
    total_periode_dinilai: number;
}

export interface MonitoringData {
    id: number;
    nama_lengkap: string;
    nip: string;
    jabatan: string;
    sudah_mengisi: boolean;
    sudah_dinilai: boolean;
    predikat_kinerja: string;
}

export interface Bidang {
    id: number;
    nama_bidang: string;
}

// --- FUNGSI API ---


export const fetchMasterPerilaku = async (): Promise<MasterPerilaku[]> => 
    axiosInstance.get('/kinerja/master-perilaku/').then(res => res.data);


export const fetchDashboardStats = async (year: number, month: number | null): Promise<DashboardStats> => {
    const response = await axiosInstance.get('/admin/kinerja/stats/', {
        params: { year, month } // Kirim month jika ada
    });
    return response.data;
};

export const fetchMonitoringData = async (filters: { unit_kerja?: number, year: number, month: number }): Promise<MonitoringData[]> => {
    const response = await axiosInstance.get('/admin/kinerja/monitoring/', {
        params: filters
    });
    return response.data;
};

export const fetchBidangList = async (): Promise<Bidang[]> => {
    const response = await axiosInstance.get('/pegawai/bidang/');
    return response.data;
};