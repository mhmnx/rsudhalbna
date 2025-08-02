// src/pages/PeriodeListPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Paper, Loader, Text, Group, Button, SimpleGrid, Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchSkpById, SKP } from '../api/skpService';

export function PeriodeListPage() {
    const { skpId } = useParams<{ skpId: string }>();
    const navigate = useNavigate();
    const [skp, setSkp] = useState<SKP | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!skpId) return;
        try {
            const data = await fetchSkpById(skpId);
            setSkp(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data SKP.' });
        } finally {
            setLoading(false);
        }
    }, [skpId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <Loader />;
    if (!skp) return <Text>Data tidak ditemukan.</Text>;

    return (
        <>
            <Group justify="space-between" mb="md">
                <Title order={3}>Pilih Periode Penilaian</Title>
                <Button variant="default" onClick={() => navigate('/penilaian')}>Kembali ke Daftar SKP</Button>
            </Group>
            <Paper withBorder p="md" radius="md" mb="lg">
                <Text>Pegawai: {skp.pegawai.nama_lengkap_gelar}</Text>
                <Text c="dimmed" size="sm">Periode SKP: {skp.periode_awal} s/d {skp.periode_akhir}</Text>
            </Paper>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {skp.periode_penilaian_list.map(period => {
                    // Terapkan logika di sini untuk setiap periode
                    const isLocked = period.is_assessment_locked;
                    const isReady = period.is_ready_for_assessment;
                    const isDisabled = !isReady && !isLocked;

                    return (
                        <Card shadow="sm" padding="lg" radius="md" withBorder key={period.id}>
                            <Text fw={500}>{period.nama_periode}</Text>
                            <Text size="sm" c="dimmed">
                                {period.tanggal_awal} - {period.tanggal_akhir}
                            </Text>
                            <Button 
                                variant="light" 
                                color="blue" 
                                fullWidth 
                                mt="md" 
                                radius="md"
                                onClick={() => navigate(`/bukti-dukung/${period.id}`)}
                                disabled={isDisabled}
                            >
                                {isLocked ? "Penilaian Terkunci" : isReady ? "Buka Penilaian Bulan Ini" : "Menunggu Pengisian Pegawai"}
                            </Button>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </>
    );
}