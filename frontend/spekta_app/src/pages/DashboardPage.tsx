// src/pages/DashboardPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Title, Text, Paper, SimpleGrid, Card, Group, Badge, Loader, Button, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../context/AuthContext';
import { fetchPegawaiDashboardData, DashboardData } from '../api/skpService';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';


const getStatusColor = (status: string) => {
  switch (status) {
      case 'Draft': return 'gray';
      case 'Diajukan': return 'blue';
      case 'Persetujuan': return 'green';
      case 'Ditolak': return 'red';
      default: return 'gray';
  }
};


export function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchPegawaiDashboardData();
            setDashboardData(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data dashboard.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <Loader />;
    if (!dashboardData) return <Text>Gagal memuat data dashboard.</Text>;

    const { pegawai_info, skp_aktif, periode_terakhir_dinilai, tugas_berikutnya } = dashboardData;

    return (
        <>
            <Title order={2} mb="xs">Selamat Datang, {pegawai_info.nama_lengkap_gelar}</Title>
            <Text c="dimmed" mb="xl">Berikut adalah ringkasan kinerja Anda.</Text>

            {/* Kartu Tugas Berikutnya */}
            <Alert icon={<IconAlertCircle size="1rem" />} title="Tugas Berikutnya" color="blue" mb="lg">
                {tugas_berikutnya}
            </Alert>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
                {/* Kartu Profil */}
                <Paper withBorder p="md" radius="md">
                    <Title order={4} mb="sm">Profil Saya</Title>
                    <Text size="sm"><strong>Nama:</strong> {pegawai_info.nama_lengkap}</Text>
                    <Text size="sm"><strong>NIP:</strong> {pegawai_info.nip}</Text>
                    <Text size="sm"><strong>Jabatan:</strong> {pegawai_info.jabatan?.nama_jabatan || '-'}</Text>
                    <Text size="sm"><strong>Unit Kerja:</strong> {pegawai_info.unit_kerja?.nama_unit || '-'}</Text>
                </Paper>

                {/* Kartu SKP Aktif */}
                <Paper withBorder p="md" radius="md">
                    {skp_aktif ? (
                        <>
                            <Group justify="space-between" align="flex-start">
                                <Title order={4} mb="sm">SKP Aktif ({skp_aktif.periode_awal.substring(0, 4)})</Title>
                                <Badge color={getStatusColor(skp_aktif.status)}>{skp_aktif.status}</Badge>
                            </Group>
                            <Text size="sm">Periode: {skp_aktif.periode_awal} s/d {skp_aktif.periode_akhir}</Text>
                            <Text size="sm">Pendekatan: {skp_aktif.pendekatan}</Text>
                            <Button mt="md" variant="filled" fullWidth onClick={() => navigate(`/skp/${skp_aktif.id}`)}>
                                Lihat Detail SKP
                            </Button>
                        </>
                    ) : (
                        <Text c="dimmed">Tidak ada SKP aktif untuk tahun ini.</Text>
                    )}
                </Paper>
            </SimpleGrid>

            {/* Kartu Penilaian Terakhir */}
            {periode_terakhir_dinilai && (
                <Paper withBorder p="md" radius="md" mt="lg">
                    <Title order={4} mb="sm">Hasil Penilaian Terakhir</Title>
                    <Group>
                        <IconCircleCheck size={24} color="green" />
                        <div>
                            <Text fw={500}>Periode {periode_terakhir_dinilai.nama_periode}</Text>
                            <Text size="sm" c="dimmed">Predikat Kinerja: <strong>{periode_terakhir_dinilai.predikat_kinerja}</strong></Text>
                        </div>
                    </Group>
                </Paper>
            )}
        </>
    );
}