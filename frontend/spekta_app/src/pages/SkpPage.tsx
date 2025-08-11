// src/pages/SkpPage.tsx
import { useEffect, useState } from 'react';
import { Title, Button, Loader, Text, Paper, Card, Group, Badge, Modal, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { DateInput } from '@mantine/dates';
import '@mantine/dates/styles.css'; // Wajib untuk styling kalender
import { fetchMySkps, createSkp, updateSkp, deleteSkp, SKP, SKPPayload } from '../api/skpService';
import { notifications } from '@mantine/notifications'; // Untuk notifikasi
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


// Fungsi untuk mapping warna badge status
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Draft': return 'gray';
        case 'Diajukan': return 'blue';
        case 'Persetujuan': return 'green';
        case 'Ditolak': return 'red';
        default: return 'gray';
    }
};

export function SkpPage() {
    const { user } = useAuth(); // Ambil data user yang login
    const [skps, setSkps] = useState<SKP[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSkp, setSelectedSkp] = useState<SKP | null>(null);
    const navigate = useNavigate();
    const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    
    const form = useForm<SKPPayload>({
        initialValues: {
            periode_awal: '',
            periode_akhir: '',
            pendekatan: 'Kuantitatif',
        },
        validate: {
            periode_awal: (value) => value ? null : 'Tanggal awal harus diisi',
            periode_akhir: (value) => value ? null : 'Tanggal akhir harus diisi',
        },
    });

    const getSkps = async () => {
        if (!user) return; // Jangan jalankan jika user belum ada
        try {
            // Kirim ID user yang login ke fungsi API
            const data = await fetchMySkps(user.user_id);
            setSkps(data);
        } catch (error) {
            notifications.show({ color: 'red', title: 'Error', message: 'Gagal memuat data SKP.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        
        getSkps();
    }, [user]);

    const handleAddSubmit = async (values: SKPPayload) => {
        try {
            await createSkp(values);
            notifications.show({ color: 'green', title: 'Sukses', message: 'Periode SKP berhasil ditambahkan.' });
            closeAddModal();
            form.reset();
            getSkps(); // Muat ulang data
        } catch (error) {
            notifications.show({ color: 'red', title: 'Error', message: 'Gagal menambahkan SKP.' });
        }
    };

    const handleEditSubmit = async (values: SKPPayload) => {
        if (!selectedSkp) return;
        try {
            await updateSkp(selectedSkp.id, values);
            notifications.show({ color: 'green', title: 'Sukses', message: 'Periode SKP berhasil diperbarui.' });
            closeEditModal();
            form.reset();
            setSelectedSkp(null);
            getSkps(); // Muat ulang data
        } catch (error: any) { // Tambahkan 'any' untuk mengakses properti error
          // CETAK DETAIL ERROR DARI SERVER
            console.error("Detail Error:", error.response.data);
            notifications.show({ color: 'red', title: 'Error', message: 'Gagal memperbarui SKP.' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus SKP ini?')) {
            try {
                await deleteSkp(id);
                notifications.show({ color: 'green', title: 'Sukses', message: 'SKP berhasil dihapus.' });
                getSkps(); // Muat ulang data
            } catch (error) {
                notifications.show({ color: 'red', title: 'Error', message: 'Gagal menghapus SKP.' });
            }
        }
    };

    const handleOpenEditModal = (skp: SKP) => {
        setSelectedSkp(skp);
        form.setValues({
            periode_awal: skp.periode_awal,
            periode_akhir: skp.periode_akhir,
            pendekatan: skp.pendekatan as 'Kuantitatif' | 'Kualitatif',
        });
        openEditModal();
    };

    if (loading) return <Loader />;

    return (
        <>
            {/* Modal Tambah SKP */}
            <Modal opened={addModalOpened} onClose={closeAddModal} title="Tambah Periode SKP">
                <form onSubmit={form.onSubmit(handleAddSubmit)}>
                    <DateInput label="Tanggal Awal" placeholder="Pilih tanggal" {...form.getInputProps('periode_awal')} required />
                    <DateInput mt="md" label="Tanggal Akhir" placeholder="Pilih tanggal" {...form.getInputProps('periode_akhir')} required />
                    <Select mt="md" label="Pendekatan" data={['Kuantitatif', 'Kualitatif']} {...form.getInputProps('pendekatan')} required />
                    <Button type="submit" mt="lg" fullWidth>Simpan</Button>
                </form>
            </Modal>

            {/* Modal Edit SKP */}
            <Modal opened={editModalOpened} onClose={closeEditModal} title="Edit Periode SKP">
                <form onSubmit={form.onSubmit(handleEditSubmit)}>
                    <DateInput label="Tanggal Awal" placeholder="Pilih tanggal" {...form.getInputProps('periode_awal')} required />
                    <DateInput mt="md" label="Tanggal Akhir" placeholder="Pilih tanggal" {...form.getInputProps('periode_akhir')} required />
                    <Select mt="md" label="Pendekatan" data={['Kuantitatif', 'Kualitatif']} {...form.getInputProps('pendekatan')} required />
                    <Button type="submit" mt="lg" fullWidth>Update</Button>
                </form>
            </Modal>

            {/* Tampilan Utama Halaman */}
            <Paper withBorder shadow="md" p="md" radius="md">
            <Group justify="space-between" mb="xl">
                    <Title order={2}>Daftar SKP Saya</Title>
                    <Button onClick={openAddModal}>Tambah Periode SKP</Button>
            </Group> 
                
                {skps.length > 0 ? (
                    skps.map(skp => (
                        <Card shadow="sm" padding="lg" radius="md" withBorder mb="md" key={skp.id}>
                            <Group justify="space-between">
                                <Text fw={500}>{`${skp.periode_awal} s/d ${skp.periode_akhir}`}</Text>
                                <Badge color={getStatusColor(skp.status)} variant="light">{skp.status.toUpperCase()}</Badge>
                            </Group>
                            <Text size="sm" c="dimmed" mt="sm">Pendekatan: {skp.pendekatan}</Text>
                            <Group mt="lg">
                                <Button variant="outline" onClick={() => navigate(`/skp/${skp.id}`)}>
                                    Detail
                                </Button>
                                <Button 
                                    variant="outline" 
                                    color="teal" 
                                    onClick={() => navigate(`/penilaian/${skp.id}`)}
                                >
                                    Penilaian
                                </Button>
                                <Button variant="outline" color="yellow" onClick={() => handleOpenEditModal(skp)} disabled={!['Draft', 'Ditolak'].includes(skp.status)}>Edit</Button>
                                <Button variant="outline" color="red" onClick={() => handleDelete(skp.id)} disabled={!['Draft', 'Ditolak'].includes(skp.status)}>Hapus</Button>
                            </Group>
                        </Card>
                    ))
                ) : (
                    <Text>Anda belum memiliki data SKP. Silakan klik tombol "Tambah Periode SKP" untuk memulai.</Text>
                )}
            </Paper>
        </>
    );
}