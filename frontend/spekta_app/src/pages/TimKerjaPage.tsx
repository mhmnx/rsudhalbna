// src/pages/TimKerjaPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Title, Loader, Text, Paper, Table } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { fetchMyTeam, TimKerjaData } from '../api/pegawaiService';

export function TimKerjaPage() {
    const { user } = useAuth();
    const [timKerjaData, setTimKerjaData] = useState<TimKerjaData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchMyTeam();
            setTimKerjaData(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data tim kerja.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <Loader />;

    const rekanKerjaRows = timKerjaData?.rekan_kerja.map((pegawai, index) => (
        <Table.Tr key={pegawai.id}>
            <Table.Td>{index + 1}</Table.Td>
            <Table.Td>{pegawai.nama_lengkap_gelar}</Table.Td>
            <Table.Td>{pegawai.nip}</Table.Td>
            <Table.Td>{pegawai.pangkat_gol_ruang || '-'}</Table.Td>
            <Table.Td>{pegawai.jabatan?.nama_jabatan || '-'}</Table.Td>
        </Table.Tr>
    ));

    return (
        <>
            <Title order={2} mb="md">Tim Kerja</Title>
            {/* Bagian Atasan */}
            <Paper withBorder p="md" radius="md" mb="lg">
                <Title order={4} c="blue.7" mb="md">Atasan Langsung</Title>
                {timKerjaData?.atasan ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nama Lengkap</Table.Th>
                                <Table.Th>NIP</Table.Th>
                                <Table.Th>Pangkat/Gol.</Table.Th>
                                <Table.Th>Jabatan</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Td>{timKerjaData.atasan.nama_lengkap_gelar}</Table.Td>
                                <Table.Td>{timKerjaData.atasan.nip}</Table.Td>
                                <Table.Td>{timKerjaData.atasan.pangkat_gol_ruang || '-'}</Table.Td>
                                <Table.Td>{timKerjaData.atasan.jabatan?.nama_jabatan || '-'}</Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Text c="dimmed">Atasan langsung tidak ditemukan.</Text>
                )}
            </Paper>

            {/* Bagian Rekan Kerja */}
            <Paper withBorder p="md" radius="md">
                <Title order={4} c="blue.7" mb="md">Daftar Rekan Kerja</Title>
                {timKerjaData && timKerjaData.rekan_kerja.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>No.</Table.Th>
                                <Table.Th>Nama Lengkap</Table.Th>
                                <Table.Th>NIP</Table.Th>
                                <Table.Th>Pangkat/Gol.</Table.Th>
                                <Table.Th>Jabatan</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rekanKerjaRows}</Table.Tbody>
                    </Table>
                ) : (
                    <Text c="dimmed">Tidak ada rekan kerja lain di unit Anda.</Text>
                )}
            </Paper>
        </>
    );
}