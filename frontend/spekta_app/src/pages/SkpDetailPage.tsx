import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// PERBAIKAN: Tambahkan 'Tooltip' ke dalam import
import { Title, Paper, Loader, Text, Badge, Group, Button, Table, ActionIcon, Collapse, Grid, Tooltip, List, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import * as skpService from '../api/skpService';
import { RhkModal } from '../components/skp/RhkModal';
import { IndikatorModal } from '../components/skp/IndikatorModal';
import { IconChevronDown, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { EkspektasiModal } from '../components/skp/EkspektasiModal';
import { LampiranModal } from '../components/skp/LampiranModal';
import React from 'react';
import { Box } from '@mantine/core';
import { AtasanApprovalForm, ApprovalFormValues } from '../components/skp/AtasanApprovalForm';


// Salin fungsi ini dari SkpPage.tsx
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Draft': return 'gray';
        case 'Diajukan': return 'blue';
        case 'Persetujuan': return 'green';
        case 'Ditolak': return 'red';
        default: return 'gray';
    }
};

export function SkpDetailPage() {
    const { skpId } = useParams<{ skpId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [skp, setSkp] = useState<skpService.SKP | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileOpened, { toggle: toggleProfile }] = useDisclosure(false);


    // PERBAIKAN: Ubah cara penggunaan useDisclosure agar lebih jelas
    const [rhkModalOpened, { open: openRhkModal, close: closeRhkModal }] = useDisclosure(false);
    const [editingRhk, setEditingRhk] = useState<skpService.RHK | null>(null);
    
    const [indikatorModalOpened, { open: openIndikatorModal, close: closeIndikatorModal }] = useDisclosure(false);
    const [editingIndikator, setEditingIndikator] = useState<skpService.Indikator | null>(null);
    const [currentRhkId, setCurrentRhkId] = useState<number | null>(null);
    const [ekspektasiModal, ekspektasiHandlers] = useDisclosure(false);
    const [editingPerilaku, setEditingPerilaku] = useState<skpService.PerilakuKerja | null>(null);
    const [ekspektasiModalOpened, { open: openEkspektasiModal, close: closeEkspektasiModal }] = useDisclosure(false);
    const [lampiranModalOpened, lampiranModalHandlers] = useDisclosure(false);
    const [lampiranDataForModal, setLampiranDataForModal] = useState<skpService.Lampiran | null>(null);
    
    const [approvalLoading, setApprovalLoading] = useState(false);
    
    // State baru untuk menyimpan data lampiran yang akan diedit



    const fetchData = async () => {
        if (!skpId) return;
        setLoading(true);
        try {
            const data = await skpService.fetchSkpById(skpId);
            setSkp(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat detail SKP.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [skpId]);

    // --- Handlers Aksi ---
    const handleSubmitSkp = async () => {
        if (!skp) return;

        // Tampilkan dialog konfirmasi sebelum mengirim
        if (window.confirm('Apakah Anda yakin ingin mengajukan SKP ini? SKP tidak dapat diubah setelah diajukan.')) {
            try {
                // Panggil fungsi API yang sudah ada
                await skpService.submitSkp(skp.id);

                // Tampilkan notifikasi sukses
                notifications.show({
                    title: 'Sukses',
                    message: 'SKP telah berhasil diajukan ke atasan.',
                    color: 'green',
                });

                // Arahkan pengguna kembali ke halaman daftar SKP
                navigate('/skp');

            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Gagal mengajukan SKP. Silakan coba lagi.',
                    color: 'red',
                });
            }
        }
    };
    
    const handleRhkSubmit = async (values: skpService.RhkPayload) => {
        try {
            if (editingRhk) {
                // Untuk update, 'skp' biasanya tidak perlu dikirim lagi
                await skpService.updateRhk(editingRhk.id, values);
                notifications.show({ color: 'green', message: 'RHK berhasil diperbarui.' });
            } else {
                // Pastikan saat membuat baru, kita menyertakan ID dari SKP yang sedang dibuka
                await skpService.createRhk({ ...values, skp: skp!.id });
                notifications.show({ color: 'green', message: 'RHK berhasil ditambahkan.' });
            }
            closeRhkModal();
            fetchData();
        } catch (e: any) { 
            console.error("Detail Error:", e.response.data); // Ini akan mencetak detail error ke console
            notifications.show({ color: 'red', message: 'Gagal menyimpan RHK.' }); 
        }
    };

    const handleIndikatorSubmit = async (values: any) => {
        try {
            if (editingIndikator) {
                await skpService.updateIndikator(editingIndikator.id, { ...values, rhk: currentRhkId! });
                notifications.show({ color: 'green', message: 'Indikator berhasil diperbarui.' });
            } else {
                await skpService.createIndikator({ ...values, rhk: currentRhkId! });
                notifications.show({ color: 'green', message: 'Indikator berhasil ditambahkan.' });
            }
            closeIndikatorModal();
            fetchData();
        } catch (e) { notifications.show({ color: 'red', message: 'Gagal menyimpan Indikator.' }); }
    };

    if (loading) return <Loader size="xl" />;
    if (!skp) return <Text>Data SKP tidak ditemukan.</Text>;
    
    const handleDeleteRhk = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus Rencana Hasil Kerja ini?')) {
            try {
                await skpService.deleteRhk(id);
                notifications.show({ color: 'green', message: 'RHK berhasil dihapus.' });
                fetchData(); // Muat ulang data untuk refresh UI
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal menghapus RHK.' });
            }
        }
    };

    const handleDeleteIndikator = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus Indikator ini?')) {
            try {
                await skpService.deleteIndikator(id);
                notifications.show({ color: 'green', message: 'Indikator berhasil dihapus.' });
                fetchData(); // Muat ulang data
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal menghapus Indikator.' });
            }
        }
    };

    const handleEkspektasiSubmit = async (values: { ekspektasi_khusus: string }) => {
        if (!editingPerilaku) return;
        try {
            // Panggil fungsi yang sekarang sudah ada
            await skpService.updateEkspektasi(editingPerilaku.id, values);
            notifications.show({ color: 'green', message: 'Ekspektasi berhasil diperbarui.' });
            closeEkspektasiModal();
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memperbarui ekspektasi.' });
        }
    };

    const openLampiranModal = async () => {
        if (!skp) return;
        try {
            const lampiranData = await skpService.getOrCreateLampiran(skp.id);
            setLampiranDataForModal(lampiranData);
            // Gunakan handler yang benar dari useDisclosure
            lampiranModalHandlers.open(); 
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyiapkan form lampiran.' });
        }
    };
    
    const handleLampiranSubmit = async (values: skpService.LampiranPayload) => {
        if (!lampiranDataForModal) {
            notifications.show({ color: 'red', message: 'Error: Data lampiran tidak ditemukan.' });
            return;
        }
        
        try {
            await skpService.updateLampiran(lampiranDataForModal.id, values);
            notifications.show({ color: 'green', message: 'Lampiran berhasil diperbarui.' });
            // Gunakan handler yang benar dari useDisclosure
            lampiranModalHandlers.close();
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memperbarui lampiran.' });
        }
    };

    const handleApprovalSubmit = async (values: ApprovalFormValues) => {
        if (!skp) return;
        setApprovalLoading(true);

        // Siapkan payload, 'catatan_penilai' saja sudah cukup
        const payload = { catatan_penolakan: values.catatan_penilai };

        try {
            if (values.keputusan === 'Persetujuan') {
                await skpService.approveSkp(skp.id, payload);
                notifications.show({ color: 'green', message: 'SKP berhasil disetujui.' });
            } else if (values.keputusan === 'Ditolak') {
                await skpService.rejectSkp(skp.id, payload);
                notifications.show({ color: 'orange', message: 'SKP telah ditolak.' });
            }
            navigate('/persetujuan'); // Kembali ke daftar persetujuan
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memproses persetujuan.' });
        } finally {
            setApprovalLoading(false);
        }
    };

    
    if (loading) return <Loader />;
    if (!skp) return <Text>Data SKP tidak ditemukan.</Text>;
    
    const isPenilai = Number(skp.pejabat_penilai.id) === Number(user?.user_id);
    const canEdit = ['Draft', 'Ditolak'].includes(skp.status) && Number(skp.pegawai.id) === Number(user?.user_id);

    
    // --- TAMBAHKAN BLOK DEBUG DI SINI ---
    console.log("--- DEBUG TIPE DATA ---");
    console.log("ID Pemilik SKP:", skp.pegawai.id, "| Tipe:", typeof skp.pegawai.id);
    console.log("ID User Login:", user?.user_id, "| Tipe:", typeof user?.user_id);
    console.log("-----------------------");
    // ------------------------------------

    

    const ProfileBox = ({ title, pegawai }: { title: string, pegawai: skpService.PegawaiSimple | null }) => {
        if (!pegawai) return <Text>Data tidak tersedia.</Text>;
        return (
            <Box>
                <Title order={6} c="blue.7">{title}</Title>
                <Table withRowBorders withColumnBorders withTableBorder verticalSpacing="xs" mt="sm">
                    <Table.Tbody>
                        <Table.Tr><Table.Td w="35%">NAMA</Table.Td><Table.Td>{pegawai.nama_lengkap_gelar}</Table.Td></Table.Tr>
                        <Table.Tr><Table.Td>NIP</Table.Td><Table.Td>{pegawai.nip}</Table.Td></Table.Tr>
                        <Table.Tr><Table.Td>PANGKAT / GOL. RUANG</Table.Td><Table.Td>{pegawai.pangkat_gol_ruang || '-'}</Table.Td></Table.Tr>
                        <Table.Tr><Table.Td>JABATAN</Table.Td><Table.Td>{pegawai.jabatan?.nama_jabatan || '-'}</Table.Td></Table.Tr>
                        <Table.Tr>
                            <Table.Td>UNIT KERJA</Table.Td>
                            <Table.Td>
                                <Group justify="space-between">
                                    <Text>{pegawai.unit_kerja?.nama_unit || '-'}</Text>
                                    
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
            </Box>
        );
    };

    
    const rhkUtama = skp.rhk_list.filter(rhk => rhk.jenis_rhk === 'Utama');
    const rhkTambahan = skp.rhk_list.filter(rhk => rhk.jenis_rhk === 'Tambahan');
    return (
        <>
             {/* --- Semua Modal Didefinisikan Di Sini --- */}
            <RhkModal opened={rhkModalOpened} onClose={closeRhkModal} onSubmit={handleRhkSubmit} initialData={editingRhk} />
            <IndikatorModal opened={indikatorModalOpened} onClose={closeIndikatorModal} onSubmit={handleIndikatorSubmit} initialData={editingIndikator} />
             {/* PERBAIKAN: Gunakan variabel yang benar untuk props modal */}
            <EkspektasiModal
                opened={ekspektasiModalOpened}
                onClose={closeEkspektasiModal}
                onSubmit={handleEkspektasiSubmit}
                initialData={editingPerilaku || undefined}
            />
            <LampiranModal
            opened={lampiranModalOpened}
            onClose={lampiranModalHandlers.close} // Gunakan handler yang benar
            onSubmit={handleLampiranSubmit}
            initialData={lampiranDataForModal}
            />

            {/* ... (Modal lainnya) ... */}

            {/* --- Header Halaman --- */}
            {/* --- Judul Utama (tanpa header terpisah) --- */}
            <Title order={3} ta="center" mb="md">SASARAN KINERJA PEGAWAI</Title>
            {skp.status === 'Ditolak' && skp.catatan_penolakan && (
            <Alert color="red" title="SKP Ditolak" mb="lg">
                <Text>Alasan Penolakan: {skp.catatan_penolakan}</Text>
            </Alert>
)}
            {/* --- Action Bar & Info Bar (Digabung) --- */}
            <Paper withBorder p="sm" radius="md" mb="md">
                <Group justify="space-between">
                <Badge color={getStatusColor(skp.status)} size="xl" variant="light">{skp.status.toUpperCase()}</Badge>
                    
                    {/* PERUBAHAN: Tombol-tombol aksi utama ditempatkan di sini */}
                    <Group>
                        {canEdit && (
                            <>
                                <Button onClick={() => { setEditingRhk(null); openRhkModal(); }} leftSection={<IconPlus size={16}/>}>
                                    Tambah Rencana Hasil Kerja
                                </Button>
                                {canEdit && <Button color="green" onClick={handleSubmitSkp}>Ajukan ke Atasan</Button>}
                            </>
                        )}
                        <Button variant="filled" color="dark">Cetak</Button>
                    </Group>
                </Group>
            </Paper>

            <Group justify="space-between" mb="lg">
                <Text size="sm" c="dimmed">RSUD HJ ANNA LASMANAH</Text>
                <Text size="sm" c="dimmed">PERIODE PENILAIAN: {new Date(skp.periode_awal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})} s/d {new Date(skp.periode_akhir).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</Text>
            </Group>
            
            {isPenilai && skp.status === 'Diajukan' && (
            <AtasanApprovalForm onSubmit={handleApprovalSubmit} loading={approvalLoading} />
        )}


            {/* --- Profil Pegawai & Penilai (Selalu Terlihat) --- */}
            <Paper withBorder p="md" radius="md" mb="lg">
                <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <ProfileBox title="PEGAWAI YANG DINILAI" pegawai={skp.pegawai} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <ProfileBox title="PEJABAT PENILAI KINERJA" pegawai={skp.pejabat_penilai} />
                    </Grid.Col>
                </Grid>
            </Paper>


            {/* --- Tabel Hasil Kerja --- */}
<Paper withBorder p="md" radius="md" mt="lg">
    <Group justify="space-between" mb="md">
        <Title size="l" order={3}>HASIL KERJA</Title>
    </Group>
    
    <Table verticalSpacing="md" withTableBorder withColumnBorders>
        <Table.Thead bg="gray.1">
            <Table.Tr>
                <Table.Th w={50} ta="center">NO</Table.Th>
                <Table.Th>RENCANA HASIL KERJA PIMPINAN YANG DIINTERVENSI</Table.Th>
                <Table.Th>RENCANA HASIL KERJA</Table.Th>
                <Table.Th w={100} ta="center">ASPEK</Table.Th>
                <Table.Th>INDIKATOR KINERJA INDIVIDU</Table.Th>
                <Table.Th>TARGET TAHUNAN</Table.Th>
                {canEdit && <Table.Th w={100} ta="center">AKSI</Table.Th>}
            </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
            {/* --- RHK UTAMA --- */}
            <Table.Tr>
                <Table.Td colSpan={canEdit ? 7 : 6} fw={700} bg="gray.0"> UTAMA</Table.Td>
            </Table.Tr>
            
            {rhkUtama.length > 0 ? rhkUtama.map((rhk, index) => (
                <Table.Tr key={rhk.id}>
                    <Table.Td ta="center">{index + 1}</Table.Td>
                    <Table.Td>{rhk.intervensi_atasan_text || '-'}</Table.Td>
                    <Table.Td>{rhk.deskripsi}</Table.Td>
                    <Table.Td ta="center">{rhk.aspek}</Table.Td>
                    <Table.Td>
                        {rhk.indikator_list.map(ind => (
                            <Group key={ind.id} justify="space-between" wrap="nowrap" mb="xs">
                                <Text size="sm">{ind.deskripsi}</Text>
                            </Group>
                        ))}
                    </Table.Td>
                    <Table.Td>
                        {rhk.indikator_list.map(ind => (
                            <Text key={ind.id} size="sm" fw={500}>{ind.target}</Text>
                        ))}
                    </Table.Td>
                    {canEdit && (
                        <Table.Td>
                            <Group justify="center">
                                <Tooltip label="Edit RHK"><ActionIcon variant="subtle" onClick={() => { setEditingRhk(rhk); openRhkModal(); }}><IconEdit size={16} /></ActionIcon></Tooltip>
                                <Tooltip label="Hapus RHK"><ActionIcon variant="subtle" color="red" onClick={() => handleDeleteRhk(rhk.id)}><IconTrash size={16} /></ActionIcon></Tooltip>
                            </Group>
                        </Table.Td>
                    )}
                </Table.Tr>
            )) : (
                <Table.Tr><Table.Td colSpan={canEdit ? 7 : 6} ta="center" c="dimmed">Belum ada RHK Utama.</Table.Td></Table.Tr>
            )}

            {/* --- RHK TAMBAHAN --- */}
            <Table.Tr>
                <Table.Td colSpan={canEdit ? 7 : 6} fw={700} bg="gray.0">TAMBAHAN</Table.Td>
            </Table.Tr>
            
            {rhkTambahan.length > 0 ? rhkTambahan.map((rhk, index) => (
                <Table.Tr key={rhk.id}>
                    <Table.Td ta="center">{index + 1}</Table.Td>
                    <Table.Td>{rhk.intervensi_atasan_text || '-'}</Table.Td>
                    <Table.Td>{rhk.deskripsi}</Table.Td>
                    <Table.Td ta="center">{rhk.aspek}</Table.Td>
                    <Table.Td>
                       {rhk.indikator_list.map(ind => (
                            <Group key={ind.id} justify="space-between" wrap="nowrap" mb="xs">
                                <Text size="sm">{ind.deskripsi}</Text>
                            </Group>
                        ))}
                        </Table.Td>
                    <Table.Td>
                        {rhk.indikator_list.map(ind => (
                            <Text key={ind.id} size="sm" fw={500}>{ind.target}</Text>
                        ))}
                    </Table.Td>
                    {canEdit && (
                        <Table.Td>
                            <Group justify="center">
                                <Tooltip label="Edit RHK"><ActionIcon variant="subtle" onClick={() => { setEditingRhk(rhk); openRhkModal(); }}><IconEdit size={16} /></ActionIcon></Tooltip>
                                <Tooltip label="Hapus RHK"><ActionIcon variant="subtle" color="red" onClick={() => handleDeleteRhk(rhk.id)}><IconTrash size={16} /></ActionIcon></Tooltip>
                            </Group>
                        </Table.Td>
                    )}
                </Table.Tr>
            )) : (
                <Table.Tr><Table.Td colSpan={canEdit ? 7 : 6} ta="center" c="dimmed">Belum ada RHK Tambahan.</Table.Td></Table.Tr>
            )}

        </Table.Tbody>
    </Table>
</Paper>

            {/* --- Perilaku Kerja --- */}
            <Paper withBorder p="md" radius="md" mt="lg">
            <Title size="l" order={3} mb="md">PERILAKU KERJA</Title>
            <Table withTableBorder withColumnBorders>
                <Table.Tbody>
                    {skp.perilaku_kerja_list.map((perilaku, index) => (
                        <React.Fragment key={perilaku.id}>
                            {/* Baris pertama berisi judul */}
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <Table.Td
                                    rowSpan={2}
                                    w={50}
                                    ta="center"
                                    // PERBAIKAN: Atur perataan vertikal ke atas dan tambahkan border kanan
                                    style={{ verticalAlign: 'top', borderRight: '1px solid #dee2e6' }}
                                >
                                    {index + 1}
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={700}>{perilaku.master_perilaku.jenis_perilaku}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={700}>Ekspektasi Khusus Pimpinan</Text>
                                </Table.Td>
                            </tr>
                            {/* Baris kedua berisi detail */}
                            <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                                <Table.Td 
                                    // PERBAIKAN: Tambahkan border kanan
                                    style={{ borderRight: '1px solid #dee2e6' }}
                                >
                                    <List 
                                        size="sm" 
                                        spacing="xs"
                                        // PERBAIKAN: Ubah tipe list menjadi huruf
                                        listStyleType='lower-alpha'
                                    >
                                        {perilaku.master_perilaku.uraian_perilaku.split('\n').map((item, i) => (
                                            item.trim() && <List.Item key={i}>{item.trim()}</List.Item>
                                        ))}
                                    </List>
                                </Table.Td>
                                <Table.Td 
                                    // PERBAIKAN: Tambahkan border kanan
                                    style={{ borderRight: '1px solid #dee2e6' }}
                                >
                                    <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                        {perilaku.ekspektasi_khusus || 'Belum diisi oleh pimpinan.'}
                                    </Text>
                                    {isPenilai && (
                                        <Button
                                            mt="sm"
                                            size="xs"
                                            variant="outline"
                                            onClick={() => { setEditingPerilaku(perilaku); openEkspektasiModal(); }}
                                        >
                                            Edit Ekspektasi
                                        </Button>
                                    )}
                                </Table.Td>
                            </tr>
                        </React.Fragment> 
                    ))}
                </Table.Tbody>
            </Table>
        </Paper>

             {/* --- Lampiran --- */}
            <Paper withBorder p="md" radius="md" mt="lg">
                <Group justify="space-between" mb="md">
                    <Title size="l" order={3}>LAMPIRAN</Title>
                    {canEdit && (
                        <Button variant="outline" onClick={openLampiranModal}>Edit Lampiran</Button>

                    )}
                </Group>
                
                <div>
                    <Title order={6} c="dimmed">DUKUNGAN SUMBER DAYA</Title>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mt={4}>
                        {skp.lampiran?.dukungan_sumber_daya || 'Belum diisi.'}
                    </Text>
                </div>

                <div style={{ borderTop: '1px solid #e9ecef', margin: '1rem 0' }} />

                <div>
                    <Title order={6} c="dimmed">SKEMA PERTANGGUNGJAWABAN</Title>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mt={4}>
                        {skp.lampiran?.skema_pertanggungjawaban || 'Belum diisi.'}
                    </Text>
                </div>

                <div style={{ borderTop: '1px solid #e9ecef', margin: '1rem 0' }} />
                
                <div>
                    <Title order={6} c="dimmed">KONSEKUENSI</Title>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mt={4}>
                        {skp.lampiran?.konsekuensi || 'Belum diisi.'}
                    </Text>
                </div>
            </Paper>
        </>
    );
}