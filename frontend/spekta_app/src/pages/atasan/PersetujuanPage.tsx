// src/pages/atasan/PersetujuanPage.tsx
import { useEffect, useState } from 'react';
import { Title, Table, Button, Loader, Text, Paper } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { fetchApprovalList, SKP } from '../../api/skpService';
import { notifications } from '@mantine/notifications';

export function PersetujuanPage() {
    const [tasks, setTasks] = useState<SKP[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const getTasks = async () => {
            try {
                const data = await fetchApprovalList();
                setTasks(data);
            } catch (err) {
                notifications.show({ color: 'red', message: 'Gagal memuat daftar persetujuan.' });
            } finally {
                setLoading(false);
            }
        };
        getTasks();
    }, []);

    if (loading) return <Loader />;

    const rows = tasks.map((task) => (
        <Table.Tr key={task.id}>
            <Table.Td>{task.pegawai.nama_lengkap_gelar}</Table.Td>
            <Table.Td>{task.pegawai.nip}</Table.Td>
            <Table.Td>{`${task.periode_awal} s/d ${task.periode_akhir}`}</Table.Td>
            <Table.Td>
                <Button variant="outline" size="xs" onClick={() => navigate(`/skp/${task.id}`)}>
                    Tinjau SKP
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder shadow="md" p={30} radius="md">
            <Title order={2} mb="md">Daftar Persetujuan SKP</Title>
            <Text c="dimmed" mb="xl">Daftar SKP bawahan yang telah diajukan dan menunggu persetujuan Anda.</Text>

            {tasks.length > 0 ? (
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nama Pegawai</Table.Th>
                            <Table.Th>NIP</Table.Th>
                            <Table.Th>Periode</Table.Th>
                            <Table.Th>Aksi</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            ) : (
                <Text>Tidak ada SKP yang memerlukan persetujuan saat ini.</Text>
            )}
        </Paper>
    );
}