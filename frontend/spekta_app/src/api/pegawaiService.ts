// src/api/pegawaiService.ts
import axiosInstance from './axiosInstance';
import { PegawaiSimple } from './skpService';

// Interface baru untuk struktur respons API
export interface TimKerjaData {
    atasan: PegawaiSimple | null;
    rekan_kerja: PegawaiSimple[];
}

// Interface untuk data Unit Kerja
export interface UnitKerja {
    id: number;
    nama_unit: string;
}


// Perbarui fungsi fetchMyTeam
export const fetchMyTeam = async (): Promise<TimKerjaData> => {
    const response = await axiosInstance.get('/pegawai/pegawai/my-team/');
    return response.data;
};

// Fungsi baru untuk mengambil semua unit kerja
export const fetchUnitKerjaList = async (bidangId?: string | null): Promise<UnitKerja[]> => {
    const response = await axiosInstance.get('/pegawai/unit-kerja/', {
        params: {
            // Kirim parameter filter jika ada
            bidang: bidangId
        }
    });
    return response.data;
};