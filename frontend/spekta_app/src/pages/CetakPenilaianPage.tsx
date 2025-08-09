// src/pages/CetakPenilaianPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Loader, Text, Group, Button, Table, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchPeriodePenilaianDetail, PeriodePenilaianDetail } from '../api/skpService';
import classes from './CetakPenilaianPage.module.css';
import React from 'react';
import { List } from '@mantine/core';
import '../print-styles.css'; // <-- Impor file CSS global
import { PrintStyles } from '../components/PrintStyles'; // <-- Impor komponen baru


// Komponen kecil untuk baris tabel profil
const ProfileRow = ({ no, label, valuePegawai, valuePenilai }: { no: number, label: string, valuePegawai: string, valuePenilai: string }) => (
    <Table.Tr>
        <Table.Td ta="center">{no}</Table.Td>
        <Table.Td>{label}</Table.Td>
        <Table.Td>{valuePegawai}</Table.Td>
        <Table.Td ta="center">{no}</Table.Td>
        <Table.Td>{label}</Table.Td>
        <Table.Td>{valuePenilai}</Table.Td>
    </Table.Tr>
);

export function CetakPenilaianPage() {
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
            document.title = `PENILAIAN KINERJA PEGAWAI_${namaPegawai}_${namaPeriode}`;
        }
        return () => {
            document.title = 'SPEKTA';
        };
    }, [periodeDetail]);

    if (loading) return <Loader size="xl" />;
    if (!periodeDetail) return <Text>Data tidak ditemukan.</Text>;

    const { skp } = periodeDetail;
    const rhkUtama = skp.rhk_list.filter(rhk => rhk.jenis_rhk === 'Utama');
    const rhkTambahan = skp.rhk_list.filter(rhk => rhk.jenis_rhk === 'Tambahan');
    
    // Format khusus untuk header periode
    const periodeHeaderMulai = new Date(periodeDetail.tanggal_awal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }).toUpperCase();
    const periodeHeaderSelesai = new Date(periodeDetail.tanggal_akhir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

    

    const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });


    return (
        <Container size="lg" className={`${classes.printContainer} landscape-page`}>
            <PrintStyles orientation="landscape" />
             <Group justify="center" mb="lg" className={classes.noPrint}>
                <Button onClick={() => window.print()}>Cetak Dokumen</Button>
                <Button variant="default" onClick={() => navigate(-1)}>Kembali</Button>
            </Group>

            {/* --- BAGIAN HEADER --- */}
            <Title order={5} ta="center">EVALUASI KINERJA PEGAWAI</Title>
            <Title order={6} ta="center">PENDEKATAN HASIL KERJA {skp.pendekatan.toUpperCase()}</Title>
            <Title order={6} ta="center" mt="md">PERIODE: {new Date(periodeDetail.tanggal_awal).toLocaleDateString('id-ID', {month: 'long'}).toUpperCase()}</Title>
            
            <Group justify="space-between" mt="xl" mb="xs">
                <Text size="sm" fw={500}>PEMERINTAH KAB. BANJARNEGARA</Text>
                <Text size="sm" fw={500}>PERIODE PENILAIAN: {periodeHeaderMulai} S/D {periodeHeaderSelesai}</Text>
            </Group>

            {/* --- TABEL PROFIL --- */}
            <Table withTableBorder verticalSpacing="xs" mb="lg" className={classes.borderedTable}>
                <Table.Thead className={classes.headerCell}>
                    <Table.Tr>
                        <Table.Th w={40}>NO</Table.Th>
                        <Table.Th colSpan={2}>PEGAWAI YANG DINILAI</Table.Th>
                        <Table.Th w={40}>NO</Table.Th>
                        <Table.Th colSpan={2}>PEJABAT PENILAI KINERJA</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    <ProfileRow no={1} label="NAMA" valuePegawai={skp.pegawai.nama_lengkap_gelar.toUpperCase()} valuePenilai={skp.pejabat_penilai.nama_lengkap_gelar.toUpperCase()} />
                    <ProfileRow no={2} label="NIP" valuePegawai={skp.pegawai.nip} valuePenilai={skp.pejabat_penilai.nip} />
                    <ProfileRow no={3} label="PANGKAT/GOL. RUANG" valuePegawai={skp.pegawai.pangkat_gol_ruang || '-'} valuePenilai={skp.pejabat_penilai.pangkat_gol_ruang || '-'} />
                    <ProfileRow no={4} label="JABATAN" valuePegawai={skp.pegawai.jabatan?.nama_jabatan || '-'} valuePenilai={skp.pejabat_penilai.jabatan?.nama_jabatan || '-'} />
                    <ProfileRow no={5} label="UNIT KERJA" valuePegawai={skp.pegawai.unit_kerja?.nama_unit || '-'} valuePenilai={skp.pejabat_penilai.unit_kerja?.nama_unit || '-'} />
                </Table.Tbody>
            </Table>

            {/* --- TABEL HASIL KERJA --- */}
            <Table withTableBorder verticalSpacing="xs" mb="lg" className={classes.borderedTable}>
                <Table.Thead className={classes.headerCell}>
                    <Table.Tr><Table.Th colSpan={8}>HASIL KERJA</Table.Th></Table.Tr>
                    <Table.Tr>
                        <Table.Th>NO</Table.Th>
                        <Table.Th>RENCANA HASIL KERJA PIMPINAN YANG DIINTERVENSI</Table.Th>
                        <Table.Th>RENCANA HASIL KERJA</Table.Th>
                        <Table.Th>ASPEK</Table.Th>
                        <Table.Th>INDIKATOR KINERJA INDIVIDU</Table.Th>
                        <Table.Th>TARGET</Table.Th>
                        <Table.Th>REALISASI BERDASARKAN BUKTI DUKUNG</Table.Th>
                        <Table.Th>UMPAN BALIK BERKELANJUTAN</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    <Table.Tr><Table.Td colSpan={8} className={classes.headerCell} style={{textAlign: 'left'}}>UTAMA</Table.Td></Table.Tr>
                    {rhkUtama.map((rhk, index) => (
                        <Table.Tr key={rhk.id}>
                            <Table.Td ta="center">{index + 1}</Table.Td>
                            <Table.Td>{rhk.intervensi_atasan_text || '-'}</Table.Td>
                            <Table.Td>{rhk.deskripsi}</Table.Td>
                            <Table.Td ta="center">{rhk.aspek}</Table.Td>
                            <Table.Td>{rhk.indikator_list.map(ind => ind.deskripsi).join(', ')}</Table.Td>
                            <Table.Td>{rhk.indikator_list.map(ind => ind.target).join(', ')}</Table.Td>
                            <Table.Td>{rhk.aksi_list.map(aksi => aksi.evaluasi?.realisasi || '-').join('\n')}</Table.Td>
                            <Table.Td>{rhk.aksi_list.map(aksi => aksi.evaluasi?.feedback_atasan || '-').join('\n')}</Table.Td>
                        </Table.Tr>
                    ))}
                    <Table.Tr><Table.Td colSpan={8} className={classes.headerCell} style={{textAlign: 'left'}}>TAMBAHAN</Table.Td></Table.Tr>
                    {rhkTambahan.map((rhk, index) => (
                        <Table.Tr key={rhk.id}>
                            <Table.Td ta="center">{index + 1}</Table.Td>
                            <Table.Td>{rhk.intervensi_atasan_text || '-'}</Table.Td>
                            <Table.Td>{rhk.deskripsi}</Table.Td>
                            <Table.Td ta="center">{rhk.aspek}</Table.Td>
                            <Table.Td>{rhk.indikator_list.map(ind => ind.deskripsi).join(', ')}</Table.Td>
                            <Table.Td>{rhk.indikator_list.map(ind => ind.target).join(', ')}</Table.Td>
                            <Table.Td>{rhk.aksi_list.map(aksi => aksi.evaluasi?.realisasi || '-').join('\n')}</Table.Td>
                            <Table.Td>{rhk.aksi_list.map(aksi => aksi.evaluasi?.feedback_atasan || '-').join('\n')}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
                <Table.Tfoot>
                    <Table.Tr><Table.Td colSpan={8} className={classes.headerCell} style={{textAlign: 'left',fontSize: '13px'}}><strong>RATING HASIL KERJA</strong></Table.Td></Table.Tr>
                    <Table.Tr><Table.Td colSpan={8} className={classes.contentCell} style={{textAlign: 'left', fontSize: '13px'}}>{periodeDetail.rating_hasil_kerja?.toUpperCase() || 'BELUM DINILAI'}</Table.Td></Table.Tr>
                </Table.Tfoot>
            </Table>

            <Table withTableBorder verticalSpacing="xs" mb="lg" className={classes.borderedTable}>
                <Table.Thead className={classes.headerCell}>
                    <Table.Tr><Table.Th colSpan={4} >PERILAKU KERJA</Table.Th></Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {skp.perilaku_kerja_list.map((perilaku, index) => (
                        <React.Fragment key={perilaku.id}>
                            <Table.Tr>
                                <Table.Td rowSpan={1} ta="center" w={40}>{index + 1}</Table.Td>
                                <Table.Td><strong>{perilaku.master_perilaku.jenis_perilaku}</strong></Table.Td>
                                <Table.Td ta="center"><strong>Ekspektasi Khusus Pimpinan</strong></Table.Td>
                                <Table.Td ta="center"><strong>Feedback</strong></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td colSpan={1}></Table.Td>
                                <Table.Td>
                                    <List size="xs" spacing={4} listStyleType="lower-alpha">
                                        {perilaku.master_perilaku.uraian_perilaku.split('\n').map((item, i) => item.trim() && <List.Item key={i}>{item.trim()}</List.Item>)}
                                    </List>
                                </Table.Td>
                                <Table.Td ta="center" style={{ whiteSpace: 'pre-wrap' }}>{perilaku.ekspektasi_khusus || ''}</Table.Td>
                                <Table.Td ta="center" style={{ whiteSpace: 'pre-wrap' }}>{perilaku.evaluasi?.feedback_atasan || '-'}</Table.Td>
                            </Table.Tr>
                        </React.Fragment>
                    ))}
                </Table.Tbody>
                <Table.Tfoot>
                <Table.Tr>
                    <Table.Td colSpan={4} className={classes.headerCell} style={{textAlign: 'left',fontSize: '13px'}}><strong>RATING PERILAKU KERJA</strong></Table.Td>
                </Table.Tr>
                <Table.Tr>
                    <Table.Td colSpan={4} className={classes.contentCell}>{periodeDetail.rating_perilaku_kerja?.toUpperCase() || 'BELUM DINILAI'}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                    <Table.Td colSpan={4} className={classes.headerCell} style={{textAlign: 'left', fontSize: '13px'}}><strong>PREDIKAT KINERJA PEGAWAI</strong></Table.Td>
                </Table.Tr>
                <Table.Tr>
                    <Table.Td colSpan={4} className={classes.contentCell}>{periodeDetail.predikat_kinerja?.toUpperCase() || 'BELUM DINILAI'}</Table.Td>
                </Table.Tr>
            </Table.Tfoot>
            </Table>


            {/* --- BAGIAN TANDA TANGAN (BARU & LENGKAP) --- */}
            <Table mt="xl">
                <Table.Tbody>
                    <Table.Tr>
                        <Table.Td style={{ border: 'none' }}></Table.Td>
                        <Table.Td style={{ border: 'none', textAlign: 'center' }}>
                            RSUD Hj. ANNA LASMANAH BANJARNEGARA, {tanggalCetak}
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td style={{ border: 'none', textAlign: 'center' }}>Pegawai yang Dinilai</Table.Td>
                        <Table.Td style={{ border: 'none', textAlign: 'center' }}>Pejabat Penilai Kinerja</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td style={{ border: 'none', height: '80px' }}></Table.Td>
                        <Table.Td style={{ border: 'none', height: '80px' }}></Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td style={{ border: 'none', textAlign: 'center', fontWeight: 'bold' }}>{skp.pegawai.nama_lengkap_gelar.toUpperCase()}</Table.Td>
                        <Table.Td style={{ border: 'none', textAlign: 'center', fontWeight: 'bold' }}>{skp.pejabat_penilai.nama_lengkap_gelar.toUpperCase()}</Table.Td>
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