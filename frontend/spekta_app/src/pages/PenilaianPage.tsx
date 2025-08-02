// src/pages/PenilaianPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Paper, Loader, Text, Group, Button, Table, Grid } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchSkpById, SKP } from '../api/skpService';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { addPeriodePenilaian, AddPeriodPayload } from '../api/skpService'; // Impor fungsi dan tipe baru
import { TambahPeriodeModal } from '../components/penilaian/TambahPeriodeModal'; // Impor modal baru
import { deleteDuplicatePeriods } from '../api/skpService';
import { useCallback } from 'react';
import * as skpService from '../api/skpService';


export function PenilaianPage() {
    const { skpId } = useParams<{ skpId: string }>();
    const navigate = useNavigate();
    const [skp, setSkp] = useState<SKP | null>(null);
    const [loading, setLoading] = useState(true);
    const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);

    const fetchData = useCallback(async () => {
        if (!skpId) return;
        setLoading(true);
        try {
            const data = await skpService.fetchSkpById(skpId);
            setSkp(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data SKP.' });
        } finally {
            setLoading(false);
        }
    }, [skpId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // Cek ini berjalan setelah data selesai dimuat (skp tidak null)
        if (skp && skp.status !== 'Persetujuan') {
            notifications.show({
                title: 'Akses Ditolak',
                message: 'Halaman penilaian hanya bisa diakses untuk SKP yang sudah berstatus "Persetujuan".',
                color: 'orange',
            });
            // Arahkan pengguna kembali ke halaman detail
            navigate(`/skp/${skp.id}`);
        }
    }, [skp, navigate]); // Jalankan efek ini setiap kali 'skp' berubah

    const handleTambahPeriode = async (values: AddPeriodPayload) => {
        if (!skp) return;
        try {
            await addPeriodePenilaian(skp.id, values);
            notifications.show({ color: 'green', message: 'Periode berhasil ditambahkan.' });
            closeAddModal();
            fetchData(); // Muat ulang data untuk menampilkan periode baru
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Gagal menambahkan periode.';
            notifications.show({ color: 'red', message: errorMsg });
        }
    };

    const handleDeleteDuplicates = async () => {
        if (!skp) return;
        if (window.confirm('Aksi ini akan mencari dan menghapus periode penilaian bulanan yang duplikat. Lanjutkan?')) {
            try {
                const response = await deleteDuplicatePeriods(skp.id);
                notifications.show({ color: 'green', title: 'Sukses', message: response.status });
                fetchData(); // Muat ulang data untuk refresh tabel
            } catch (error) {
                notifications.show({ color: 'red', title: 'Error', message: 'Gagal membersihkan data duplikat.' });
            }
        }
    };

    useEffect(() => {
        
        if (!skpId) return;
        const getSkpData = async () => {
            try {
                const data = await fetchSkpById(skpId);
                setSkp(data);
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal memuat data SKP.' });
            } finally {
                setLoading(false);
            }
        };
        getSkpData();
    }, [skpId]);

    if (loading) return <Loader size="xl" />;
    if (!skp) return <Text>Data SKP tidak ditemukan.</Text>;
    if (!skp || skp.status !== 'Persetujuan') {
        return <Loader size="xl" />;
    }
    
    const rows = skp.periode_penilaian_list.map((period) => {
        
        const tanggal = new Date(period.tanggal_awal);
        const namaPeriodeIndonesia = tanggal.toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric'
        });
        return (
        
        <Table.Tr key={period.id}>
            <Table.Td>
            <Text fw={500}>{namaPeriodeIndonesia}</Text>
            
            <Text size="xs" c="dimmed">{`${period.tanggal_awal} s/d ${period.tanggal_akhir}`}</Text>
            {/* Menampilkan data snapshot */}
            <Text size="xs" mt="sm">Unit Kerja: <Text span fw={50}>{period.unit_kerja_saat_itu || '-'}</Text></Text>
            <Text size="xs">Jabatan: <Text span fw={50}>{period.jabatan_saat_itu || '-'}</Text></Text>
            <Text size="xs">Penilai: <Text span fw={50}>{period.penilai_saat_itu || '-'}</Text></Text>
            <Button 
                variant="outline" 
                color="green" 
                size="xs" 
                mt="sm" 
                fullWidth
                onClick={() => navigate(`/cetak-penilaian/${period.id}`)}
            >
                Cetak Form Penilaian
            </Button>
            <Button 
                variant="outline" 
                color="blue" 
                size="xs" 
                mt="xs" 
                fullWidth
                onClick={() => navigate(`/cetak-evaluasi/${period.id}`)}
            >
                Cetak Dokumen Evaluasi
            </Button>
            </Table.Td>
            <Table.Td ta="center">{period.rating_hasil_kerja || '-'}</Table.Td>
            <Table.Td ta="center">{period.rating_perilaku_kerja || '-'}</Table.Td>
            <Table.Td ta="center">{period.predikat_kinerja || '-'}</Table.Td>
            <Table.Td ta="center">{period.capaian_organisasi || '-'}</Table.Td>
            <Table.Td>
                <Button.Group orientation="vertical">
                    <Button mt="md" variant="filled" color="rgba(255, 0, 0, 1)" onClick={() => navigate(`/rencana-aksi/${skp.id}/${period.id}`)}>Rencana Aksi</Button>
                    <Button mt="md" variant="filled" color="blue" onClick={() => navigate(`/bukti-dukung/${period.id}`)}>Pengisian Bukti Dukung</Button>
                </Button.Group>
            </Table.Td>
        </Table.Tr>

    );
    })

    return (
        <>

            <TambahPeriodeModal
                opened={addModalOpened}
                onClose={closeAddModal}
                onSubmit={handleTambahPeriode}
                skp={skp}
            />
            <Group justify="space-between" mb="md">
                <Title order={3}>Penilaian SKP</Title>
                <Button variant="default" onClick={() => navigate(`/skp/${skpId}`)}>Kembali ke Detail SKP</Button>
            </Group>

            <Group mb="lg">
                <Button color="rgba(57, 218, 138, 1)" leftSection={<IconPlus size={15}/>} onClick={openAddModal}>
                    Tambah Periode Penilaian
                </Button>
                <Button color="rgba(253, 172, 65, 1)" leftSection={<IconTrash size={15}/>}onClick={handleDeleteDuplicates}>Hapus Periode Duplikat</Button>
            </Group>

            {/* Informasi Pegawai */}
            <Paper withBorder p="md" radius="md" mb="lg">
                    <Grid>
                        <Grid.Col span={12}>
                            <Text size="sm" c="dimmed">PERIODE SKP</Text>
                            <Text fw={500}>{`${skp.periode_awal} s/d ${skp.periode_akhir}`}</Text>
                        </Grid.Col>
                    </Grid>
                    <div style={{ borderTop: '1px solid #e9ecef', margin: '1rem 0' }} />
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <Text size="sm" c="dimmed">PEGAWAI</Text>
                            <Text fw={500}>{skp.pegawai.nama_lengkap_gelar}</Text>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <Text size="sm" c="dimmed">JABATAN SAAT INI</Text>
                            <Text fw={500}>{skp.pegawai.jabatan?.nama_jabatan || '-'}</Text>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <Text size="sm" c="dimmed">UNIT KERJA SAAT INI</Text>
                            <Text fw={500}>{skp.pegawai.unit_kerja?.nama_unit || '-'}</Text>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                            <Text size="sm" c="dimmed">ATASAN PENILAI SAAT INI</Text>
                            <Text fw={500}>{skp.pejabat_penilai?.nama_lengkap_gelar || '-'}</Text>
                        </Grid.Col>
                    </Grid>

                    {/* Menambahkan border pemisah */}


                    
            </Paper>

            {/* Pelaksanaan Kinerja */}
            <Paper withBorder radius="md">
                <Table striped highlightOnHover withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Pelaksanaan Kinerja</Table.Th>
                            <Table.Th ta="center">Hasil Kerja</Table.Th>
                            <Table.Th ta="center">Perilaku Kerja</Table.Th>
                            <Table.Th ta="center">Nilai SKP</Table.Th>
                            <Table.Th ta="center">Capaian Organisasi</Table.Th>
                            <Table.Th>Aksi</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows.length > 0 ? rows : (
                            <Table.Tr>
                                <Table.Td colSpan={6} ta="center" p="xl">
                                    <Text c="dimmed">Belum ada periode penilaian.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>
        </>
    );
}