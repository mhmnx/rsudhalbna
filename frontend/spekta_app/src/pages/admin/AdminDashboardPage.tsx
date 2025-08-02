// src/pages/admin/AdminDashboardPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Title, Paper, SimpleGrid, Text, Loader, Group, Select, Table, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchDashboardStats, fetchMonitoringData, DashboardStats, MonitoringData } from '../../api/masterDataService';
import { fetchUnitKerjaList, UnitKerja } from '../../api/pegawaiService';
import { IconFileExport } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { fetchBidangList } from '../../api/masterDataService';
import axiosInstance from '../../api/axiosInstance';



// Placeholder untuk data filter, idealnya ini diambil dari API
const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
        years.push((currentYear - i).toString());
    }
    return years;
};
const monthsData = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' }, 
    { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
];
// const unitKerjaData = [{ value: '1', label: 'Umum & Kepegawaian' }];

export function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
    const [loading, setLoading] = useState(true);



    // State untuk filter
    const [yearsData] = useState(generateYears());

    const [bidangOptions, setBidangOptions] = useState<{ value: string, label: string }[]>([]);
    const [unitKerjaOptions, setUnitKerjaOptions] = useState<{ value: string, label: string }[]>([]);
    
    const [selectedYear, setSelectedYear] = useState<string | null>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string | null>((new Date().getMonth() + 1).toString());
    const [selectedBidang, setSelectedBidang] = useState<string | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const selectedMonthName = monthsData.find(m => m.value === selectedMonth)?.label || '';
    useEffect(() => {
        const loadBidang = async () => {
            try {
                const units = await fetchBidangList();
                const options = units.map(bidang => ({
                    value: bidang.id.toString(),
                    label: bidang.nama_bidang
                }));
                setBidangOptions(options);
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal memuat daftar bidang.' });
            }
        };
        loadBidang();
    }, []);

    // useEffect untuk memuat Unit Kerja setiap kali Bidang berubah
    // useEffect untuk memuat Unit Kerja setiap kali Bidang berubah
    useEffect(() => {
        if (!selectedBidang) {
            setUnitKerjaOptions([]);
            setSelectedUnit(null);
            return;
        }

        const loadUnitKerja = async () => {
            try {
                // Panggil API dengan ID bidang yang dipilih
                const units = await fetchUnitKerjaList(selectedBidang);
                const options = units.map(unit => ({
                    value: unit.id.toString(),
                    label: unit.nama_unit
                }));
                setUnitKerjaOptions(options);
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal memuat daftar unit kerja.' });
            }
        };
        
        loadUnitKerja();
    }, [selectedBidang]); // Jalankan ulang setiap kali selectedBidang berubah
    
    const loadData = useCallback(async () => {
        if (!selectedYear || !selectedMonth) return;
        setLoading(true);
        try {
            // PERBAIKAN: Kirim selectedMonth ke fetchDashboardStats
            const statsPromise = fetchDashboardStats(Number(selectedYear), Number(selectedMonth));
            const monitoringPromise = fetchMonitoringData({ 
                year: Number(selectedYear), 
                month: Number(selectedMonth),
                unit_kerja: selectedUnit ? Number(selectedUnit) : undefined
            });

            const [statsData, monitoringResult] = await Promise.all([statsPromise, monitoringPromise]);
            
            setStats(statsData);
            setMonitoringData(monitoringResult);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data dashboard.' });
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth, selectedUnit]);

    useEffect(() => {
        loadData();
    }, [loadData]);

        // useEffect untuk memuat daftar unit kerja sekali saja

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleExport = async () => {
        if (!selectedYear || !selectedMonth) {
            notifications.show({ color: 'red', message: 'Tahun dan Bulan harus dipilih untuk ekspor.' });
            return;
        }

        try {
            const response = await axiosInstance.get('/admin/kinerja/monitoring/export/', {
                params: {
                    year: selectedYear,
                    month: selectedMonth,
                    unit_kerja: selectedUnit || undefined
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Membuat nama file dinamis
            const unitName = unitKerjaOptions.find(opt => opt.value === selectedUnit)?.label || 'SEMUA_UNIT';
            const monthName = monthsData.find(opt => opt.value === selectedMonth)?.label || selectedMonth;
            const filename = `laporan_skp_${unitName}_${monthName}_${selectedYear}.xlsx`;
            link.setAttribute('download', filename);
            
            document.body.appendChild(link);
            link.click();

            // PERBAIKAN: Hapus link dengan aman
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
            window.URL.revokeObjectURL(url);

        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal mengunduh file laporan.' });
        }
    };

    const monitoringRows = monitoringData.map((item) => (
        <Table.Tr key={item.id}>
            <Table.Td>{item.nama_lengkap}</Table.Td>
            <Table.Td>{item.nip}</Table.Td>
            <Table.Td>{item.jabatan}</Table.Td>
            <Table.Td>
                <Badge color={item.sudah_mengisi ? 'green' : 'red'}>
                    {item.sudah_mengisi ? 'Lengkap' : 'Belum'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge color={item.sudah_dinilai ? 'green' : 'red'}>
                    {item.sudah_dinilai ? 'Sudah' : 'Belum'}
                </Badge>
            </Table.Td>
        </Table.Tr>
    ));

    
    return (
        <>
            <Title order={2} mb="md">Dashboard Admin</Title>

            {/* Kartu Statistik */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="lg">
                <Paper withBorder p="md" radius="md"><Text size="sm">Total Pegawai (BLUD/THL)</Text><Text fw={700} size="xl">{stats?.total_pegawai || 0}</Text></Paper>
                <Paper withBorder p="md" radius="md"><Text size="sm">SKP Dibuat ({selectedYear})</Text><Text fw={700} size="xl">{stats?.total_skp_tahunan || 0}</Text></Paper>
                {/* PERBAIKAN: Tampilkan nama bulan di judul kartu */}
                <Paper withBorder p="md" radius="md"><Text size="sm">Periode Terisi ({selectedMonthName})</Text><Text fw={700} size="xl">{stats?.total_periode_dibuat || 0}</Text></Paper>
                <Paper withBorder p="md" radius="md"><Text size="sm">Periode Dinilai ({selectedMonthName})</Text><Text fw={700} size="xl">{stats?.total_periode_dinilai || 0}</Text></Paper>
            </SimpleGrid>   

            {/* Tabel Monitoring */}
            <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="md">
                    <Title order={4}>Monitoring Pengisian SKP</Title>
                    <Button onClick={handleExport} leftSection={<IconFileExport size={16} />}>Ekspor ke Excel</Button>
                </Group>
                <Group grow mb="md">
                    <Select label="Tahun SKP" data={yearsData} value={selectedYear} onChange={setSelectedYear} />
                    <Select label="Periode Bulan" data={monthsData} value={selectedMonth} onChange={setSelectedMonth} />
                    <Select label="Bidang" placeholder="Pilih Bidang" data={bidangOptions} value={selectedBidang} onChange={setSelectedBidang} clearable />
                    <Select label="Unit Kerja" placeholder="Pilih Unit Kerja" data={unitKerjaOptions} value={selectedUnit} onChange={setSelectedUnit} disabled={!selectedBidang} clearable />
                </Group>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nama Pegawai</Table.Th>
                            <Table.Th>NIP</Table.Th>
                            <Table.Th>Jabatan</Table.Th>
                            <Table.Th>Status Pengisian</Table.Th>
                            <Table.Th>Status Penilaian</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{loading ? <Table.Tr><Table.Td colSpan={5} ta="center"><Loader /></Table.Td></Table.Tr> : monitoringRows}</Table.Tbody>
                </Table>
            </Paper>
        </>
    );
}