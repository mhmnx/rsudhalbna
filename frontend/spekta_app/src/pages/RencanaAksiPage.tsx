// src/pages/RencanaAksiPage.tsx
import { useEffect, useState, useCallback } from 'react'; // 1. Impor useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Paper, Loader, Text, Group, Button, Table, List, ActionIcon, Box, Grid } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import * as skpService from '../api/skpService';
import { RencanaAksiModal } from '../components/skp/RencanaAksiModal';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { fetchSkpById } from '../api/skpService';
import { fetchPeriodePenilaianDetail, PeriodePenilaianDetail, RencanaAksi as RencanaAksiType, RencanaAksiPayload, createRencanaAksi, updateRencanaAksi, deleteRencanaAksi } from '../api/skpService';


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
    
    

export function RencanaAksiPage() {
    const { skpId } = useParams<{ skpId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    
    const [modalOpened, modalHandlers] = useDisclosure(false);
    const [editingAksi, setEditingAksi] = useState<skpService.RencanaAksi | null>(null);
    const [currentRhkId, setCurrentRhkId] = useState<number | null>(null);
    const { periodeId } = useParams<{ periodeId: string }>();

    const [periodeDetail, setPeriodeDetail] = useState<PeriodePenilaianDetail | null>(null);

    // 2. Bungkus fetchData dengan useCallback
    const fetchData = useCallback(async () => {
        if (!periodeId) return;
        setLoading(true);
        try {
            // Panggil API untuk mengambil detail periode, bukan detail SKP
            const data = await fetchPeriodePenilaianDetail(Number(periodeId));
            setPeriodeDetail(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data.' });
        } finally {
            setLoading(false);
        }
    }, [periodeId]); // Tambahkan periodeId sebagai dependensi

    // 3. Pastikan useEffect memanggil fetchData yang sudah di-memoize
    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    const handleOpenModal = (rhkId: number, aksi: skpService.RencanaAksi | null) => {
        setCurrentRhkId(rhkId);
        setEditingAksi(aksi);
        modalHandlers.open();
    };

    const handleSubmit = async (values: { deskripsi: string, target: string }) => {
        // Pastikan periodeId dari URL tersedia
        if (!periodeId) {
            notifications.show({ color: 'red', message: 'ID Periode tidak ditemukan.' });
            return;
        }

        try {
            if (editingAksi) {
                // Logika update tidak perlu diubah, karena periode tidak akan berubah saat diedit
                await skpService.updateRencanaAksi(editingAksi.id, { ...values, rhk: editingAksi.rhk });
                notifications.show({ color: 'green', message: 'Rencana Aksi berhasil diperbarui.' });
            } else {
                // --- PERBAIKAN UTAMA DI SINI ---
                // Tambahkan 'periode: Number(periodeId)' ke dalam payload
                await skpService.createRencanaAksi({ 
                    ...values, 
                    rhk: currentRhkId!, 
                    periode: Number(periodeId) 
                });
                notifications.show({ color: 'green', message: 'Rencana Aksi berhasil ditambahkan.' });
            }
            modalHandlers.close();
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyimpan Rencana Aksi.' });
        }
    };
    
    const handleDelete = async (id: number) => {
        if(window.confirm('Anda yakin ingin menghapus Rencana Aksi ini?')) {
            try {
                await skpService.deleteRencanaAksi(id);
                notifications.show({ color: 'green', message: 'Rencana Aksi berhasil dihapus.' });
                fetchData(); // Panggilan ini juga akan bekerja dengan benar
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal menghapus Rencana Aksi.' });
            }
        }
    };

    
    if (loading) return <Loader />;
    if (!periodeDetail) return <Text>Data tidak ditemukan.</Text>;

    const { skp } = periodeDetail; // Ambil skp dari periodeDetail
    const canManageAksi = skp.status === 'Persetujuan' && Number(skp.pegawai.id) === Number(user?.user_id);

    const namaPeriodeIndonesia = new Date(periodeDetail.tanggal_awal).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <>
            <RencanaAksiModal
                opened={modalOpened}
                onClose={modalHandlers.close}
                onSubmit={handleSubmit}
                initialData={editingAksi}
            />
            
            <Group justify="space-between" mb="md">
                <Title order={3}>Rencana Aksi</Title>
                <Button variant="default" onClick={() => navigate(`/penilaian/${skpId}`)}>Kembali</Button>
            </Group>

            <Paper withBorder p="md" radius="md" mb="lg">
                <Title order={5} c="blue.7">SASARAN KINERJA PEGAWAI</Title>
                <Text>{skp.periode_awal} s/d {skp.periode_akhir}</Text>
                <Text>Periode: {new Date(periodeDetail.tanggal_awal).toLocaleDateString('id-ID', {month: 'long'}).toUpperCase()}</Text>
                <Text>Pegawai: {skp.pegawai.nama_lengkap_gelar}</Text>
            </Paper>
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
                        <Paper withBorder radius="md">
                <Table withColumnBorders withRowBorders withTableBorder verticalSpacing="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th w={50}>NO.</Table.Th>
                            <Table.Th>RENCANA HASIL KERJA</Table.Th>
                            <Table.Th>RENCANA AKSI</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {skp.rhk_list.map((rhk, index) => (
                            <Table.Tr key={rhk.id}>
                                <Table.Td>{index + 1}</Table.Td>
                                <Table.Td>
                                    <Text fw={500}>{rhk.deskripsi}</Text>
                                    
                                    {/* --- PERBAIKAN TAMPILAN INDIKATOR --- */}
                                    <Box mt="sm">
                                        <Text size="sm" fw={700}>Indikator:</Text>
                                        {rhk.indikator_list.map(ind => (
                                            <Text key={ind.id} size="xs" c="dimmed">
                                                - <strong>{rhk.aspek}</strong> - {ind.deskripsi}
                                                <br/>
                                                <Text span fw={700} ml={15}>Target Tahunan:</Text> {ind.target}
                                            </Text>
                                        ))}
                                    </Box>
                                </Table.Td>
                                <Table.Td>
                                    {canManageAksi && (
                                        <Button size="xs" leftSection={<IconPlus size={14} />} mb="sm" onClick={() => handleOpenModal(rhk.id, null)}>
                                            Tambah Rencana Aksi
                                        </Button>
                                    )}
                                <List spacing="xs" size="sm">
                                    {/* PERBARUI LOGIKA DI SINI */}
                                    {rhk.aksi_list && rhk.aksi_list.length > 0 ? (
                                        rhk.aksi_list.map((aksi, aksiIndex) => (
                                            <List.Item key={aksi.id}>
                                                <Group justify="space-between">
                                                    <Text>{aksiIndex + 1}. {aksi.deskripsi} (Target: {aksi.target || '-'})</Text>
                                                    {canManageAksi && (
                                                        <Group gap="xs">
                                                            <ActionIcon variant="light" onClick={() => handleOpenModal(rhk.id, aksi)}><IconEdit size={16}/></ActionIcon>
                                                            <ActionIcon variant="light" color="red" onClick={() => handleDelete(aksi.id)}><IconTrash size={16}/></ActionIcon>
                                                        </Group>
                                                    )}
                                                </Group>
                                            </List.Item>
                                        ))
                                    ) : (
                                        // Tampilkan pesan jika tidak ada Rencana Aksi
                                        <Text size="sm" c="dimmed">Belum ada rencana aksi.</Text>
                                    )}
                                </List>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
        </>
    );
}