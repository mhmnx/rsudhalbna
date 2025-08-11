// src/pages/atasan/PenilaianListPage.tsx
import { useEffect, useState, useCallback } from 'react'; // 1. Impor useCallback
import { Title, Table, Button, Loader, Text, Paper, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import * as skpService from '../../api/skpService'; // Ganti nama impor agar lebih jelas
import { notifications } from '@mantine/notifications';

export function PenilaianListPage() {
    const [skpList, setSkpList] = useState<skpService.SKP[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 2. Buat fungsi fetchData yang konsisten dan bisa dipanggil ulang
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await skpService.fetchPenilaianList();
            setSkpList(data);
        } catch (err) {
            notifications.show({ color: 'red', message: 'Gagal memuat daftar SKP untuk dinilai.' });
        } finally {
            setLoading(false);
        }
    }, []);

    // 3. Panggil fetchData dari useEffect
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRevertToDraft = async (skpId: number) => {
        if (window.confirm('Apakah Anda yakin ingin mengembalikan SKP ini ke status DRAFT? Pegawai akan dapat mengeditnya kembali.')) {
            try {
                await skpService.revertSkpToDraft(skpId);
                notifications.show({ color: 'green', message: 'SKP berhasil dikembalikan ke Draft.' });
                // Panggil fetchData yang sudah benar untuk me-refresh daftar
                fetchData(); 
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal mengembalikan SKP ke Draft.' });
            }
        }
    };

    if (loading) return <Loader />;

    const rows = skpList.map((skp) => (
        
        <Table.Tr key={skp.id}>
            <Table.Td>{skp.pegawai.nama_lengkap_gelar}</Table.Td>
            <Table.Td>{skp.pegawai.nip}</Table.Td>
            <Table.Td>{`${skp.periode_awal} s/d ${skp.periode_akhir}`}</Table.Td>
            <Table.Td>
                <Group>
                    <Button variant="filled" size="xs" onClick={() => navigate(`/skp/${skp.id}/periode`)}>
                        Buka Penilaian
                    </Button>
                    <Button variant="filled" color="yellow" size="xs" onClick={() => handleRevertToDraft(skp.id)}>
                        Kembalikan ke Draft
                    </Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder shadow="md" p="md" radius="md">
            <Title order={2} mb="md">Penilaian SKP</Title>
            <Text c="dimmed" mb="xl">Daftar SKP bawahan yang aktif dan siap untuk dinilai secara periodik.</Text>

            {skpList.length > 0 ? (
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nama Pegawai</Table.Th>
                            <Table.Th>NIP</Table.Th>
                            <Table.Th>Periode SKP</Table.Th>
                            <Table.Th>Aksi</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            ) : (
                <Text>Tidak ada SKP yang siap untuk dinilai saat ini.</Text>
            )}
        </Paper>
    );
}