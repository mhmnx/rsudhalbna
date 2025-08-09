// src/api/skpService.ts
import axiosInstance from './axiosInstance';

// --- INTERFACES (Tipe Data Lengkap) ---

export interface Indikator {
    id: number;
    deskripsi: string;
    target: string;
}

export interface RHK {
    id: number;
    deskripsi: string;
    intervensi_atasan_text: string | null;
    aspek: string;
    jenis_rhk: 'Utama' | 'Tambahan';
    indikator_list: Indikator[];
    aksi_list: RencanaAksi[]; // <-- TAMBAHKAN BARIS INI
}

export interface PegawaiSimple {
    id: number;
    nama_lengkap: string;
    nama_lengkap_gelar: string;
    nip: string;
    pangkat_gol_ruang: string | null;
    jabatan: { nama_jabatan: string } | null; 
    unit_kerja: { nama_unit: string } | null;
    // Tambahkan field baru
    nik: string | null;
    penempatan_awal: string | null;
    jenis_pegawai: string | null;
    status_kepegawaian: string | null;
    status_perkawinan: string | null;
    pendidikan_terakhir: string | null;
    alamat: string | null;
}

export interface PerilakuKerja {
    id: number;
    ekspektasi_khusus: string;
    master_perilaku: { jenis_perilaku: string; uraian_perilaku: string; };
    evaluasi: EvaluasiPerilaku | null; // <-- Tambahkan ini
}

export interface SKP {
    id: number;
    status: string;
    periode_awal: string;
    periode_akhir: string;
    pendekatan: string;
    pegawai: PegawaiSimple;
    pejabat_penilai: PegawaiSimple;
    rhk_list: RHK[];
    perilaku_kerja_list: PerilakuKerja[];
    lampiran: Lampiran | null; // <-- PASTIKAN BARIS INI ADA
    periode_penilaian_list: PeriodePenilaian[];
    atasan_pejabat_penilai: PegawaiSimple | null;
    catatan_penolakan: string | null;
    

}


export interface Lampiran {
    id: number;
    dukungan_sumber_daya: string;
    skema_pertanggungjawaban: string;
    konsekuensi: string;
}

export interface PeriodePenilaian {
    id: number;
    nama_periode: string;
    tanggal_awal: string;
    tanggal_akhir: string;
    rating_hasil_kerja: string | null;
    rating_perilaku_kerja: string | null;
    predikat_kinerja: string | null; // <-- TAMBAHKAN / PASTIKAN BARIS INI ADA
    capaian_organisasi: string | null;
    catatan_rekomendasi: string | null;
    penilai_saat_itu: string | null;
    jabatan_saat_itu: string | null;
    unit_kerja_saat_itu: string | null;
    is_assessment_locked: boolean;
    is_ready_for_assessment: boolean;
}


export interface EvaluasiAksi {
    id: number;
    realisasi: string | null;
    dasar_realisasi: string | null; // <-- TAMBAHKAN INI
    feedback_atasan: string | null;
    bukti_dukung_list: { id: number; link_bukti: string; deskripsi: string | null }[];
}


export interface PeriodePenilaianDetail extends PeriodePenilaian {
    skp: SKP; // SKP Induk
    evaluasi_aksi_list: EvaluasiAksi[];
    is_assessment_locked: boolean;
    is_ready_for_assessment: boolean;
}

export interface BuktiDukung { id: number; link_bukti: string; deskripsi: string | null; }

export interface RencanaAksi {
    id: number;
    deskripsi: string;
    target: string | null;
    rhk: number;
    evaluasi: EvaluasiAksi | null; // Evaluasi sekarang bersarang di sini
    periode: number;
}

export interface EvaluasiPerilaku {
    id: number;
    feedback_atasan: string | null;
}
// --- PAYLOADS (Data yang Dikirim ke API) ---

export interface SKPPayload {
    periode_awal: string;
    periode_akhir: string;
    pendekatan: 'Kuantitatif' | 'Kualitatif';
}

export interface RhkPayload {
    skp: number;
    deskripsi: string;
    intervensi_atasan_text: string;
    aspek: string;
    jenis_rhk: 'Utama' | 'Tambahan'; // <-- TAMBAHKAN INI
    indikator_list: Omit<Indikator, 'id'>[]; 
}

export interface IndikatorPayload {
    rhk: number;
    deskripsi: string;
    target: string;
}

export interface EkspektasiPayload { ekspektasi_khusus: string; }

export interface LampiranPayload {
    dukungan_sumber_daya: string;
    skema_pertanggungjawaban: string;
    konsekuensi: string;
}

export interface PersetujuanPayload {
    catatan_penolakan: string;
}

export interface AddPeriodPayload {
    month: number; // 1-12
    year: number;
}

export interface RencanaAksiPayload {
    rhk: number;
    deskripsi: string;
    target: string;
    periode: number;
}

export interface RealisasiPayload {
    realisasi: string;
    dasar_realisasi: string; // <-- TAMBAHKAN INI
}
export interface BuktiDukungPayload { evaluasi_aksi: number; link_bukti: string; deskripsi?: string; }

export type RatingPayload = Partial<{
    rating_hasil_kerja: string;
    rating_perilaku_kerja: string;
    predikat_kinerja: string;
    capaian_organisasi: string; // <-- TAMBAHKAN INI
    catatan_rekomendasi: string; // <-- TAMBAHKAN INI
}>

export interface FeedbackPayload {
    feedback_atasan: string;
}

export interface DashboardData {
    pegawai_info: PegawaiSimple;
    skp_aktif: SKP | null;
    periode_terakhir_dinilai: PeriodePenilaian | null;
    tugas_berikutnya: string;
}


// --- FUNGSI API ---

// SKP Actions
export const fetchMySkps = async (pegawaiId: number): Promise<SKP[]> => {
    const response = await axiosInstance.get('/kinerja/skp/', {
        params: {
            pegawai: pegawaiId // Kirim parameter ?pegawai=<id>
        }
    });
    return response.data;
};
export const fetchSkpById = async (id: string, periodeId?: string): Promise<SKP> => {
    const response = await axiosInstance.get(`/kinerja/skp/${id}/`, {
        params: {
            // Kirim periode_id sebagai query parameter jika ada
            periode_id: periodeId
        }
    });
    return response.data;
};

export const createSkp = async (data: SKPPayload): Promise<SKP> => axiosInstance.post('/kinerja/skp/', data).then(res => res.data);
export const updateSkp = async (id: number, data: SKPPayload): Promise<SKP> => axiosInstance.patch(`/kinerja/skp/${id}/`, data).then(res => res.data);
export const deleteSkp = async (id: number): Promise<void> => axiosInstance.delete(`/kinerja/skp/${id}/`);
export const submitSkp = async (id: number): Promise<void> => axiosInstance.post(`/kinerja/skp/${id}/submit/`);

// RHK CRUD
export const createRhk = async (data: RhkPayload) => axiosInstance.post('/kinerja/rhk/', data);
export const updateRhk = async (id: number, data: Partial<RhkPayload>) => axiosInstance.patch(`/kinerja/rhk/${id}/`, data);
export const deleteRhk = async (id: number) => axiosInstance.delete(`/kinerja/rhk/${id}/`);
export const updateEkspektasi = async (id: number, data: EkspektasiPayload) => {
    return axiosInstance.patch(`/kinerja/perilaku-kerja/${id}/`, data);
};


// Indikator CRUD
export const createIndikator = async (data: IndikatorPayload) => axiosInstance.post('/kinerja/indikator/', data);
export const updateIndikator = async (id: number, data: Partial<IndikatorPayload>) => axiosInstance.patch(`/kinerja/indikator/${id}/`, data);
export const deleteIndikator = async (id: number) => axiosInstance.delete(`/kinerja/indikator/${id}/`);

// Lampiran CRUD
export const updateLampiran = async (id: number, data: LampiranPayload) => {
    return axiosInstance.patch(`/kinerja/lampiran/${id}/`, data);
};


// Persetujuan SKP
export const fetchApprovalList = async (): Promise<SKP[]> => {
    const response = await axiosInstance.get('/kinerja/persetujuan/');
    return response.data;
};

export const approveSkp = async (id: number, data: PersetujuanPayload): Promise<void> => {
    await axiosInstance.post(`/kinerja/skp/${id}/approve/`, data);
};

export const rejectSkp = async (id: number, data: PersetujuanPayload): Promise<void> => {
    await axiosInstance.post(`/kinerja/skp/${id}/reject/`, data);
};



// Periode Penilaian
export const addPeriodePenilaian = async (skpId: number, data: AddPeriodPayload): Promise<void> => {
    await axiosInstance.post(`/kinerja/skp/${skpId}/add-period/`, data);
};

export const deleteDuplicatePeriods = async (skpId: number): Promise<{ status: string }> => {
    const response = await axiosInstance.post(`/kinerja/skp/${skpId}/clean-duplicate-periods/`);
    return response.data;
};

// Rencana Aksi CRUD
export const createRencanaAksi = async (data: RencanaAksiPayload) => axiosInstance.post('/kinerja/rencana-aksi/', data);
export const updateRencanaAksi = async (id: number, data: Partial<RencanaAksiPayload>) => axiosInstance.patch(`/kinerja/rencana-aksi/${id}/`, data);
export const deleteRencanaAksi = async (id: number) => axiosInstance.delete(`/kinerja/rencana-aksi/${id}/`);


// Periode Penilaian
export const fetchPeriodePenilaianDetail = async (id: number): Promise<PeriodePenilaianDetail> => {
    const response = await axiosInstance.get(`/kinerja/periode-penilaian/${id}/`);
    return response.data;
};

// Bukti Dukung
export const createBuktiDukung = async (data: BuktiDukungPayload) => axiosInstance.post('/kinerja/bukti-dukung/', data);
export const updateBuktiDukung = async (id: number, data: Partial<BuktiDukungPayload>) => axiosInstance.patch(`/kinerja/bukti-dukung/${id}/`, data);
export const deleteBuktiDukung = async (id: number) => axiosInstance.delete(`/kinerja/bukti-dukung/${id}/`);

// Realisasi
export const updateRealisasi = async (evaluasiAksiId: number, data: RealisasiPayload) => {
    return axiosInstance.patch(`/kinerja/evaluasi-aksi/${evaluasiAksiId}/`, data);
};

// Fungsi baru untuk "get or create"
export const getOrCreateEvaluasiAksi = async (rencana_aksi: number, periode: number): Promise<EvaluasiAksi> => {
    const response = await axiosInstance.post('/kinerja/evaluasi-aksi/get-or-create/', { rencana_aksi, periode });
    return response.data;
};

export const getOrCreateLampiran = async (skpId: number): Promise<Lampiran> => {
    const response = await axiosInstance.post(`/kinerja/skp/${skpId}/get-or-create-lampiran/`);
    return response.data;
};


export const getOrCreateEvaluasiPerilaku = async (perilaku_kerja: number, periode: number): Promise<EvaluasiPerilaku> => {
    const response = await axiosInstance.post('/kinerja/evaluasi-perilaku/get-or-create/', { perilaku_kerja, periode });
    return response.data;
};

// Rating
export const submitAssessment = async (periodeId: number, data: RatingPayload): Promise<void> => {
    await axiosInstance.post(`/kinerja/periode-penilaian/${periodeId}/submit-assessment/`, data);
};

export const fetchPenilaianList = async (): Promise<SKP[]> => {
    const response = await axiosInstance.get('/kinerja/penilaian-list/');
    return response.data;
};

export const revertSkpToDraft = async (id: number): Promise<void> => {
    await axiosInstance.post(`/kinerja/skp/${id}/revert-to-draft/`);
};

export const updateFeedback = async (evaluasiAksiId: number, data: FeedbackPayload) => {
    // Kita gunakan endpoint PATCH yang sama dengan updateRealisasi
    return axiosInstance.patch(`/kinerja/evaluasi-aksi/${evaluasiAksiId}/`, data);
};

export const updatePeriodePenilaian = async (id: number, data: RatingPayload) => {
    return axiosInstance.patch(`/kinerja/periode-penilaian/${id}/`, data);
};

export const updateFeedbackPerilaku = async (id: number, data: FeedbackPayload): Promise<void> => {
    await axiosInstance.patch(`/kinerja/evaluasi-perilaku/${id}/`, data);
};

export const fetchPublicPrintRedirect = async (nip: string, year: number, month: number): Promise<PeriodePenilaianDetail> => {
    const response = await axiosInstance.get(`/kinerja/preview/${nip}/${year}/${month}/`);
    return response.data;
};

export const fetchPegawaiDashboardData = async (): Promise<DashboardData> => {
    const response = await axiosInstance.get('/kinerja/dashboard-data/');
    return response.data;
};