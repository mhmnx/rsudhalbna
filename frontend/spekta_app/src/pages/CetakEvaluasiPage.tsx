// src/pages/CetakEvaluasiPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Loader, Text, Group, Button, Table, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchPeriodePenilaianDetail, PeriodePenilaianDetail, PegawaiSimple } from '../api/skpService';
import classes from './CetakEvaluasiPage.module.css';

// Komponen helper untuk menampilkan blok profil
const ProfileSection = ({ number, title, pegawai }: { number: number, title: string, pegawai: PegawaiSimple | null | undefined }) => (
    <>
        <Table.Tr className={classes.headerRow}>
            <Table.Td width={3} rowSpan={6} ta="center">{number}.</Table.Td>
            <Table.Td colSpan={2}>{title}</Table.Td>
        </Table.Tr>
        <Table.Tr><Table.Td w="50%">NAMA</Table.Td><Table.Td>: {pegawai?.nama_lengkap_gelar.toUpperCase() || '-'}</Table.Td></Table.Tr>
        <Table.Tr><Table.Td>NIP</Table.Td><Table.Td>: {pegawai?.nip || '-'}</Table.Td></Table.Tr>
        <Table.Tr><Table.Td>PANGKAT/GOL. RUANG</Table.Td><Table.Td>: {pegawai?.pangkat_gol_ruang || '-'}</Table.Td></Table.Tr>
        <Table.Tr><Table.Td>JABATAN</Table.Td><Table.Td>: {pegawai?.jabatan?.nama_jabatan || '-'}</Table.Td></Table.Tr>
        <Table.Tr><Table.Td>UNIT KERJA</Table.Td><Table.Td>: {pegawai?.unit_kerja?.nama_unit || '-'}</Table.Td></Table.Tr>
    </>
);

export function CetakEvaluasiPage() {
    const { periodeId } = useParams<{ periodeId: string }>();
    const navigate = useNavigate();
    const [periodeDetail, setPeriodeDetail] = useState<PeriodePenilaianDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!periodeId) return;
        try {
            const data = await fetchPeriodePenilaianDetail(Number(periodeId));
            setPeriodeDetail(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data.' });
        } finally {
            setLoading(false);
        }
    }, [periodeId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (periodeDetail) {
            const namaPegawai = periodeDetail.skp.pegawai.nama_lengkap_gelar;
            const namaPeriode = periodeDetail.nama_periode;
            // Set judul halaman
            document.title = `DOKUMEN EVALUASI KINERJA PEGAWAI_${namaPegawai}_${namaPeriode}`;
        }
        // Kembalikan ke judul default saat komponen dilepas
        return () => {
            document.title = 'SPEKTA';
        };
    }, [periodeDetail]); // Jalankan saat periodeDetail berubah

    if (loading) return <Loader size="xl" />;
    if (!periodeDetail) return <Text>Data tidak ditemukan.</Text>;

    const { skp } = periodeDetail;
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <Container size="sm" className={classes.printContainer}>
            <Group justify="center" mb="lg" className={classes.noPrint}>
                <Button onClick={() => window.print()}>Cetak</Button>
                <Button variant="default" onClick={() => navigate(-1)}>Kembali</Button>
            </Group>

            <Title order={5} ta="center">DOKUMEN EVALUASI KINERJA PEGAWAI</Title>
            <Title order={6} ta="center">PERIODE: {new Date(periodeDetail.tanggal_awal).toLocaleDateString('id-ID', {month: 'long'}).toUpperCase()}</Title>

            <Table mt="xl" mb="lg" className={classes.tableCustom}>
                <Table.Tbody>
                    <ProfileSection number={1} title="PEGAWAI YANG DINILAI" pegawai={skp.pegawai} />
                    <ProfileSection number={2} title="PEJABAT PENILAI KINERJA" pegawai={skp.pejabat_penilai} />
                    <ProfileSection number={3} title="ATASAN PEJABAT PENILAI KINERJA" pegawai={skp.atasan_pejabat_penilai} />

                    <Table.Tr className={classes.headerRow}><Table.Td rowSpan={3} ta="center">4.</Table.Td><Table.Td colSpan={2}>EVALUASI KINERJA</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td>CAPAIAN KINERJA ORGANISASI</Table.Td><Table.Td>: {periodeDetail.capaian_organisasi || '-'}</Table.Td></Table.Tr>
                    <Table.Tr><Table.Td>PREDIKAT KINERJA PEGAWAI</Table.Td><Table.Td>: {periodeDetail.predikat_kinerja || 'BELUM DINILAI'}</Table.Td></Table.Tr>
                    
                    <Table.Tr className={classes.headerRow}><Table.Td rowSpan={2} ta="center">5.</Table.Td><Table.Td  colSpan={2}>CATATAN/REKOMENDASI</Table.Td></Table.Tr>
                    <Table.Tr>
                        <Table.Td colSpan={3} style={{ height: '30px' }}>
                        {periodeDetail.catatan_rekomendasi || '-'}
                        </Table.Td>
                    </Table.Tr>
                </Table.Tbody>
            </Table>
            
            {/* --- Tanda Tangan --- */}
            <Table  style={{ border: 'none' }}>
                <Table.Tbody>
                    <Table.Tr>
                        <Table.Td style={{ border: 'none', textAlign: 'center' }}>Pegawai yang Dinilai</Table.Td>
                        <Table.Td style={{ border: 'none', textAlign: 'center' }}>
                            Banjarnegara, {tanggalCetak}
                            <br />
                            Pejabat Penilai Kinerja
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td style={{ border: 'none', height: '50px' }}></Table.Td>
                        <Table.Td style={{ border: 'none', height: '50px' }}></Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td style={{ border: 'none', textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline' }}>{skp.pegawai.nama_lengkap_gelar.toUpperCase()}</Table.Td>
                        <Table.Td style={{ border: 'none', textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline' }}>{skp.pejabat_penilai.nama_lengkap_gelar.toUpperCase()}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td style={{ border: 'none', textAlign: 'center' }}>NIP. {skp.pegawai.nip}</Table.Td>
                        <Table.Td style={{ border: 'none', textAlign: 'center' }}>NIP. {skp.pejabat_penilai.nip}</Table.Td>
                    </Table.Tr>
                </Table.Tbody>
            </Table>
        </Container>
    );
}