// src/pages/atasan/AtasanDashboardPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Title, Loader, Text, Paper, Table, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { fetchAtasanDashboardData, BawahanDashboard } from '../../api/atasanService';

export function AtasanDashboardPage() {
    const [bawahanList, setBawahanList] = useState<BawahanDashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAtasanDashboardData();
            setBawahanList(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data dashboard.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <Loader />;

    const rows = bawahanList.map((bawahan) => (
        <Table.Tr key={bawahan.id}>
            <Table.Td>{bawahan.nama_lengkap_gelar}</Table.Td>
            <Table.Td>{bawahan.nip}</Table.Td>
            <Table.Td>{bawahan.jabatan?.nama_jabatan || '-'}</Table.Td>
            <Table.Td>{bawahan.skp_aktif_status}</Table.Td>
            <Table.Td>
                {bawahan.total_periode_count > 0 
                    ? `${bawahan.periode_dinilai_count} / ${bawahan.total_periode_count} Periode` 
                    : '-'}
            </Table.Td>
            <Table.Td>{bawahan.periode_penilaian_bulan_ini}</Table.Td>
            <Table.Td>
                {bawahan.skp_aktif_id && (
                    <Button.Group>
                        <Button variant="light" size="xs" onClick={() => navigate(`/skp/${bawahan.skp_aktif_id}`)}>Detail SKP</Button>
                        <Button variant="light" size="xs" onClick={() => navigate(`/skp/${bawahan.skp_aktif_id}/periode`)}>Penilaian</Button>
                    </Button.Group>
                )}
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder p="md" radius="md">
            <Title order={2} mb="md">Dashboard Atasan</Title>
            <Text c="dimmed" mb="xl">Monitor progres SKP dan penilaian bawahan Anda.</Text>

            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Nama Bawahan</Table.Th>
                        <Table.Th>NIP</Table.Th>
                        <Table.Th>Jabatan</Table.Th>
                        <Table.Th>Status SKP</Table.Th>
                        <Table.Th>Progres Penilaian</Table.Th>
                        <Table.Th>Periode Penilaian Bulan Ini</Table.Th>
                        <Table.Th>Aksi</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={6} ta="center">Anda tidak memiliki bawahan.</Table.Td></Table.Tr>}
                </Table.Tbody>
            </Table>
        </Paper>
    );
}