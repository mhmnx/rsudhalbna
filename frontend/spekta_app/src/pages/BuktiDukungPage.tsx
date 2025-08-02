// src/pages/BuktiDukungPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Title, Paper, Loader, Text, Group, Button, Table, List, ActionIcon, Tooltip, Anchor } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import * as skpService from '../api/skpService';
import { useAuth } from '../context/AuthContext';
import { RealisasiModal } from '../components/penilaian/RealisasiModal';
import { BuktiDukungModal } from '../components/penilaian/BuktiDukungModal';
import { IconEdit, IconTrash, IconPlus, IconMessageDots } from '@tabler/icons-react';
import { RatingModal } from '../components/penilaian/RatingModal';
import { FeedbackModal } from '../components/penilaian/FeedbackModal';
import { Box, Grid } from '@mantine/core';
import { AtasanCatatanForm } from '../components/penilaian/AtasanCatatanForm'; // Impor komponen baru




export function BuktiDukungPage() {
    const { periodeId } = useParams<{ periodeId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [periodeDetail, setPeriodeDetail] = useState<skpService.PeriodePenilaianDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // --- PERBAIKAN: Deklarasi state modal yang rapi dan konsisten ---
    const [realisasiModalOpened, realisasiModalHandlers] = useDisclosure(false);
    const [buktiModalOpened, buktiModalHandlers] = useDisclosure(false);
    const [feedbackModalOpened, feedbackModalHandlers] = useDisclosure(false);
    const [ratingHasilModalOpened, ratingHasilModalHandlers] = useDisclosure(false);
    const [ratingPerilakuModalOpened, ratingPerilakuModalHandlers] = useDisclosure(false);
    const [predikatModalOpened, predikatModalHandlers] = useDisclosure(false);
    const [feedbackPerilakuModal, feedbackPerilakuHandlers] = useDisclosure(false);
    const [selectedEvaluasiPerilaku, setSelectedEvaluasiPerilaku] = useState<skpService.EvaluasiPerilaku | null>(null);

    
    const [selectedEvaluasi, setSelectedEvaluasi] = useState<skpService.EvaluasiAksi | null>(null);
    const [selectedBukti, setSelectedBukti] = useState<skpService.BuktiDukung | null>(null);

    const fetchData = useCallback(async () => {
        if (!periodeId) return;
        setLoading(true);
        try {
            const data = await skpService.fetchPeriodePenilaianDetail(Number(periodeId));
            setPeriodeDetail(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data detail periode.' });
        } finally {
            setLoading(false);
        }
    }, [periodeId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Handlers ---
    const handleRealisasiSubmit = async (values: skpService.RealisasiPayload) => {
        if (!selectedEvaluasi) return;
        try {
            await skpService.updateRealisasi(selectedEvaluasi.id, values);
            notifications.show({ color: 'green', message: 'Realisasi berhasil disimpan.' });
            realisasiModalHandlers.close();
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyimpan realisasi.' });
        }
    };
    
    const handleBuktiSubmit = async (values: Omit<skpService.BuktiDukungPayload, 'evaluasi_aksi'>) => {
        if (!selectedEvaluasi) return;
        try {
            if (selectedBukti) {
                await skpService.updateBuktiDukung(selectedBukti.id, values);
                notifications.show({ color: 'green', message: 'Bukti dukung berhasil diperbarui.' });
            } else {
                await skpService.createBuktiDukung({ ...values, evaluasi_aksi: selectedEvaluasi.id });
                notifications.show({ color: 'green', message: 'Bukti dukung berhasil ditambahkan.' });
            }
            buktiModalHandlers.close();
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyimpan bukti dukung.' });
        }
    };
    
    const handleDeleteBukti = async (id: number) => {
        if(window.confirm('Anda yakin ingin menghapus bukti dukung ini?')) {
            try {
                await skpService.deleteBuktiDukung(id);
                notifications.show({ color: 'green', message: 'Bukti dukung berhasil dihapus.' });
                fetchData();
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal menghapus bukti dukung.' });
            }
        }
    };

    const handleFeedbackSubmit = async (values: skpService.FeedbackPayload) => {
        if (!selectedEvaluasi) return;
        try {
            await skpService.updateFeedback(selectedEvaluasi.id, values);
            notifications.show({ color: 'green', message: 'Feedback berhasil disimpan.' });
            feedbackModalHandlers.close();
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyimpan feedback.' });
        }
    };
    
    const handleRatingSubmit = async (values: skpService.RatingPayload) => {
        if (!periodeDetail) return;
        try {
            await skpService.updatePeriodePenilaian(periodeDetail.id, values);
            notifications.show({ color: 'green', message: 'Penilaian berhasil disimpan.' });
            ratingHasilModalHandlers.close();
            ratingPerilakuModalHandlers.close();
            predikatModalHandlers.close();
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyimpan penilaian.' });
        }
    };


    const handleCatatanSubmit = async (values: { capaian_organisasi: string, catatan_rekomendasi: string }) => {
        if (!periodeDetail) return;
        try {
            await skpService.updatePeriodePenilaian(periodeDetail.id, values);
            notifications.show({ color: 'green', message: 'Catatan berhasil disimpan.' });
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyimpan catatan.' });
        }
    };

    const openFeedbackPerilakuModal = async (perilaku: skpService.PerilakuKerja) => {
        try {
            const evaluasi = await skpService.getOrCreateEvaluasiPerilaku(perilaku.id, Number(periodeId));
            setSelectedEvaluasiPerilaku(evaluasi);
            feedbackPerilakuHandlers.open();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyiapkan form feedback.' });
        }
    };

    const handleFeedbackPerilakuSubmit = async (values: skpService.FeedbackPayload) => {
        if (!selectedEvaluasiPerilaku) return;
        try {
            await skpService.updateFeedbackPerilaku(selectedEvaluasiPerilaku.id, values);
            notifications.show({ color: 'green', message: 'Feedback berhasil disimpan.' });
            feedbackPerilakuHandlers.close();
            fetchData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyimpan feedback.' });
        }
    };

    const openEditRealisasiModal = async (aksi: skpService.RencanaAksi) => {
        try {
            const evaluasi = await skpService.getOrCreateEvaluasiAksi(aksi.id, Number(periodeId));
            setSelectedEvaluasi(evaluasi);
            realisasiModalHandlers.open();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyiapkan form.' });
        }
    };

    const openBuktiDukungModal = async (aksi: skpService.RencanaAksi, bukti: skpService.BuktiDukung | null) => {
        try {
            const evaluasi = await skpService.getOrCreateEvaluasiAksi(aksi.id, Number(periodeId));
            setSelectedEvaluasi(evaluasi);
            setSelectedBukti(bukti);
            buktiModalHandlers.open();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyiapkan form.' });
        }
    };

    const openFeedbackModal = async (aksi: skpService.RencanaAksi) => {
        try {
            const evaluasi = await skpService.getOrCreateEvaluasiAksi(aksi.id, Number(periodeId));
            setSelectedEvaluasi(evaluasi);
            feedbackModalHandlers.open();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyiapkan form feedback.' });
        }
    };


    if (loading) return <Loader />;
    if (!periodeDetail) return <Text>Data tidak ditemukan.</Text>;

    const { skp } = periodeDetail;
    const canEdit = Number(skp.pegawai.id) === Number(user?.user_id);
    const isPenilai = Number(skp.pejabat_penilai.id) === Number(user?.user_id);
    const isLocked = periodeDetail.is_assessment_locked;

    const rhkUtama = skp.rhk_list.filter(rhk => rhk.jenis_rhk === 'Utama');
    const rhkTambahan = skp.rhk_list.filter(rhk => rhk.jenis_rhk === 'Tambahan');

    const prepareUrl = (url: string) => {
        if (!url) return '#'; // Kembalikan link non-fungsional jika kosong
        // Jika sudah memiliki http atau https, gunakan apa adanya
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // Jika tidak, tambahkan '//' di depan agar menjadi link eksternal
        return `//${url}`;
    };

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

    return (
        <>
            <RealisasiModal opened={realisasiModalOpened} onClose={realisasiModalHandlers.close} onSubmit={handleRealisasiSubmit} initialData={selectedEvaluasi} />
            <BuktiDukungModal opened={buktiModalOpened} onClose={buktiModalHandlers.close} onSubmit={handleBuktiSubmit} initialData={selectedBukti} />
            <FeedbackModal opened={feedbackModalOpened} onClose={feedbackModalHandlers.close} onSubmit={handleFeedbackSubmit} initialData={selectedEvaluasi} />
            <FeedbackModal 
                opened={feedbackPerilakuModal} 
                onClose={feedbackPerilakuHandlers.close} 
                onSubmit={handleFeedbackPerilakuSubmit}
                initialData={selectedEvaluasiPerilaku}
            />
            <RatingModal 
                opened={ratingHasilModalOpened} 
                onClose={ratingHasilModalHandlers.close} 
                onSubmit={handleRatingSubmit}
                title="Edit Rating Hasil Kerja"
                fieldName="rating_hasil_kerja"
                data={['Di Atas Ekspektasi', 'Sesuai Ekspektasi', 'Di Bawah Ekspektasi']}
                initialValue={periodeDetail.rating_hasil_kerja || ''}
            />
            <RatingModal 
                opened={ratingPerilakuModalOpened} 
                onClose={ratingPerilakuModalHandlers.close} 
                onSubmit={handleRatingSubmit}
                title="Edit Rating Perilaku Kerja"
                fieldName="rating_perilaku_kerja"
                data={['Di Atas Ekspektasi', 'Sesuai Ekspektasi', 'Di Bawah Ekspektasi']}
                initialValue={periodeDetail.rating_perilaku_kerja || ''}
            />
            <RatingModal 
                opened={predikatModalOpened} 
                onClose={predikatModalHandlers.close} 
                onSubmit={handleRatingSubmit}
                title="Edit Predikat Kinerja Pegawai"
                fieldName="predikat_kinerja" // Pastikan ini benar
                data={['Sangat Baik', 'Baik', 'Butuh Perbaikan', 'Kurang', 'Sangat Kurang']}
                // PERBAIKI PROPERTI DI BAWAH INI
                initialValue={periodeDetail.predikat_kinerja || ''}
            />

            <Paper withBorder p="md" radius="md" mb="lg">
                <Text>Periode: {new Date(periodeDetail.tanggal_awal).toLocaleDateString('id-ID', {month: 'long'}).toUpperCase()}</Text>
            </Paper>
            
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

            <Paper withBorder radius="md" mb="lg">
                <Title size='l' order={4} p="md">HASIL KERJA</Title>
                <Table withTableBorder withColumnBorders verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>NO.</Table.Th>
                            <Table.Th>RENCANA HASIL KERJA PIMPINAN YANG DIINTERVENSI</Table.Th>
                            <Table.Th>RENCANA HASIL KERJA</Table.Th>
                            <Table.Th>RENCANA AKSI</Table.Th>
                            <Table.Th>ASPEK</Table.Th>
                            <Table.Th>INDIKATOR KINERJA INDIVIDU</Table.Th>
                            <Table.Th>TARGET TAHUNAN</Table.Th>
                            <Table.Th>BUKTI DUKUNG</Table.Th>
                            <Table.Th>REALISASI</Table.Th>
                            <Table.Th>FEEDBACK</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {/* RHK UTAMA */}
                        <Table.Tr><Table.Td colSpan={10} fw={700} bg="gray.0">UTAMA</Table.Td></Table.Tr>
                        {rhkUtama.map((rhk, rhkIndex) => (
                            rhk.aksi_list.map((aksi, aksiIndex) => (
                                <Table.Tr key={aksi.id}>
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1} ta="center">{rhkIndex + 1}</Table.Td>}
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1}>{rhk.intervensi_atasan_text || '-'}</Table.Td>}
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1}>{rhk.deskripsi}</Table.Td>}
                                    <Table.Td>{aksi.deskripsi}</Table.Td>
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1} ta="center">{rhk.aspek}</Table.Td>}
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1}>{rhk.indikator_list.map(ind => <Text key={ind.id} >{ind.deskripsi}</Text>)}</Table.Td>}
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1}>{rhk.indikator_list.map(ind => <Text key={ind.id} fw={500}>{ind.target}</Text>)}</Table.Td>}
                                    <Table.Td>
                                        {/* PERBAIKI PANGGILAN FUNGSI DI TOMBOL INI */}
                                        {canEdit && <Button disabled={isLocked} color="green" size="xs" variant="filled" mb="xs" onClick={() => openBuktiDukungModal(aksi, null)}>Tambah</Button>}
                                        <List size="xs" spacing={4}>
                                            {aksi.evaluasi?.bukti_dukung_list.map(bukti => (
                                                <List.Item key={bukti.id}>
                                                    <Group justify="space-between" wrap="nowrap">
                                                        <Anchor href={prepareUrl(bukti.link_bukti)} target="_blank" size="xs">{bukti.deskripsi || bukti.link_bukti}</Anchor>
                                                        {canEdit && 
                                                            <Group gap="xs" wrap="nowrap">
                                                                <Tooltip label="Edit Bukti"><ActionIcon disabled={isLocked} size="xs" variant="light" onClick={() => openBuktiDukungModal(aksi, bukti)}><IconEdit size={14} /></ActionIcon></Tooltip>
                                                                <Tooltip label="Hapus Bukti"><ActionIcon disabled={isLocked} size="xs" variant="light" color="red" onClick={() => handleDeleteBukti(bukti.id)}><IconTrash size={14} /></ActionIcon></Tooltip>
                                                            </Group>
                                                        }
                                                    </Group>
                                                </List.Item>
                                            ))}
                                        </List>
                                    </Table.Td>
                                    <Table.Td>
                                        {/* PERBAIKAN: Mengirim objek 'aksi' yang benar */}
                                        {canEdit && <Button disabled={isLocked} color="yellow" size="xs" variant="filled" onClick={() => openEditRealisasiModal(aksi)}>Edit</Button>}
                                        <Text size="sm" mt="xs" style={{whiteSpace: 'pre-wrap'}}>{aksi.evaluasi?.realisasi ? (<>{aksi.evaluasi.realisasi}{aksi.evaluasi.dasar_realisasi && <Text size="xs" c="dimmed">berdasarkan {aksi.evaluasi.dasar_realisasi}</Text>}</>) : '-'}</Text>
                                    </Table.Td> 
                                    <Table.Td>
                            <Text size="sm" style={{whiteSpace: 'pre-wrap'}}>{aksi.evaluasi?.feedback_atasan || '-'}</Text>
                            {isPenilai && (
                                <Button disabled={isLocked} size="xs" variant="subtle" mt="xs" leftSection={<IconMessageDots size={14}/>} onClick={() => openFeedbackModal(aksi)}>
                                    {isLocked ? 'Terkunci' : 'Beri Feedback'}
                                </Button>
                            )}
                        </Table.Td>
                        </Table.Tr>
                            ))
                        ))}
                        {/* RHK TAMBAHAN */}
                        {/* --- RHK TAMBAHAN (KODE LENGKAP) --- */}
                        <Table.Tr>
                            <Table.Td colSpan={10} fw={700} bg="gray.0">TAMBAHAN</Table.Td>
                        </Table.Tr>
                        {rhkTambahan.length > 0 ? rhkTambahan.map((rhk, rhkIndex) => (
                            rhk.aksi_list?.map((aksi, aksiIndex) => (
                                <Table.Tr key={aksi.id}>
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1} ta="center">{rhkIndex + 1}</Table.Td>}
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1}>{rhk.intervensi_atasan_text || '-'}</Table.Td>}
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1}>{rhk.deskripsi}</Table.Td>}
                                    <Table.Td>{aksi.deskripsi}</Table.Td>
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1} ta="center">{rhk.aspek}</Table.Td>}
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1}>{rhk.indikator_list.map(ind => <Text key={ind.id}>{ind.deskripsi}</Text>)}</Table.Td>}
                                    {aksiIndex === 0 && <Table.Td rowSpan={rhk.aksi_list.length || 1}>{rhk.indikator_list.map(ind => <Text key={ind.id}  fw={500}>{ind.target}</Text>)}</Table.Td>}
                                    <Table.Td>
                                        {/* PERBAIKI PANGGILAN FUNGSI DI TOMBOL INI */}
                                        {canEdit && <Button disabled={isLocked} color="green" size="xs" variant="filled" mb="xs" onClick={() => openBuktiDukungModal(aksi, null)}>Tambah</Button>}

 
                                        <List size="xs" spacing={4}>
                                            {aksi.evaluasi?.bukti_dukung_list.map(bukti => (
                                                <List.Item key={bukti.id}>
                                                    <Group justify="space-between" wrap="nowrap">
                                                        <Anchor href={prepareUrl(bukti.link_bukti)} target="_blank" size="xs">{bukti.deskripsi || bukti.link_bukti}</Anchor>
                                                        {canEdit && 
                                                            <Group gap="xs" wrap="nowrap">
                                                                <Tooltip label="Edit Bukti"><ActionIcon disabled={isLocked} size="xs" variant="light" onClick={() => openBuktiDukungModal(aksi, bukti)}><IconEdit size={14} /></ActionIcon></Tooltip>
                                                                <Tooltip label="Hapus Bukti"><ActionIcon disabled={isLocked} size="xs" variant="light" color="red" onClick={() => handleDeleteBukti(bukti.id)}><IconTrash size={14} /></ActionIcon></Tooltip>
                                                            </Group>
                                                        }
                                                    </Group>
                                                </List.Item>
                                            ))}
                                        </List>
                                    </Table.Td>
                                    <Table.Td>
                                        {/* PERBAIKAN: Mengirim objek 'aksi' yang benar */}
                                        {canEdit && <Button disabled={isLocked} color="yellow" size="xs" variant="filled" onClick={() => openEditRealisasiModal(aksi)}>Edit</Button>}
                                        <Text size="sm" mt="xs" style={{whiteSpace: 'pre-wrap'}}>{aksi.evaluasi?.realisasi ? (<>{aksi.evaluasi.realisasi}{aksi.evaluasi.dasar_realisasi && <Text size="xs" c="dimmed">berdasarkan {aksi.evaluasi.dasar_realisasi}</Text>}</>) : '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                            <Text size="sm" style={{whiteSpace: 'pre-wrap'}}>{aksi.evaluasi?.feedback_atasan || '-'}</Text>
                            {isPenilai && (
                                <Button disabled={isLocked} size="xs" variant="subtle" mt="xs" leftSection={<IconMessageDots size={14}/>} onClick={() => openFeedbackModal(aksi)}>
                                    {isLocked ? 'Terkunci' : 'Beri Feedback'}
                                </Button>
                            )}
                        </Table.Td>
                                </Table.Tr>
                            ))
                        )) : <Table.Tr></Table.Tr>}
                    </Table.Tbody>
                    {/* Di dalam <Table> untuk HASIL KERJA */}
                    <Table.Tfoot>
                    <Table.Tr style={{ borderTop: '2px solid #dee2e6' }}>
                        {/* Gunakan colSpan yang benar & hapus perataan kanan */}
                        <Table.Td colSpan={10}>
                            <Group align="center">
                                <div style={{ minWidth: 200 }}> {/* Beri lebar minimum agar rapi */}
                                    <Text size="xs" c="dimmed" fw={700}>RATING HASIL KERJA:</Text>
                                    <Text size="sm" fw={500}>
                                        {periodeDetail.rating_hasil_kerja?.toUpperCase() || 'BELUM DINILAI'}
                                    </Text>
                                </div>
                                {/* Tombol edit tetap ada untuk atasan */}
                                {isPenilai && <ActionIcon disabled={isLocked} variant='light' onClick={ratingHasilModalHandlers.open}><IconEdit size={16}/></ActionIcon>}
                            </Group>
                        </Table.Td>
                    </Table.Tr>
                </Table.Tfoot>
                </Table>
            </Paper>

            {/* --- Tabel Perilaku Kerja --- */}
            <Paper withBorder radius="md" mb="lg">
                <Title size='l' order={4} p="md">PERILAKU KERJA</Title>
                <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>NO.</Table.Th>
                            <Table.Th>PERILAKU KERJA</Table.Th>
                            <Table.Th>EKSPEKTASI KHUSUS PIMPINAN</Table.Th>
                            <Table.Th>FEEDBACK</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {skp.perilaku_kerja_list.map((perilaku, index) => (
                            <Table.Tr key={perilaku.id}>
                                <Table.Td>{index + 1}</Table.Td>
                                <Table.Td>
                                    <Text fw={500}>{perilaku.master_perilaku.jenis_perilaku}</Text>
                                    <List size="xs" spacing={4} mt="xs" listStyleType='lower-alpha'>
                                        {perilaku.master_perilaku.uraian_perilaku.split('\n').map((item, i) => item.trim() && <List.Item key={i}>{item.trim()}</List.Item>)}
                                    </List>
                                </Table.Td>
                                <Table.Td>{perilaku.ekspektasi_khusus || ''}</Table.Td>
                                <Table.Td>
                                    <Text size="sm">{perilaku.evaluasi?.feedback_atasan || '-'}</Text>
                                    {isPenilai && (
                                        <Button 
                                            disabled={isLocked}
                                            size="xs" 
                                            variant="subtle" 
                                            mt="xs"
                                            leftSection={<IconMessageDots size={14}/>}
                                            onClick={() => openFeedbackPerilakuModal(perilaku)}
                                        >
                                            {isLocked ? 'Terkunci' : 'Beri Feedback'}
                                        </Button>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                    <Table.Tfoot>
                    <Table.Tr style={{ borderTop: '2px solid #dee2e6' }}>
                        <Table.Td colSpan={4}>
                            <Group align="center">
                                <div style={{ minWidth: 200 }}>
                                    <Text size="xs" c="dimmed" fw={700}>RATING PERILAKU KERJA:</Text>
                                    <Text size="sm" fw={500}>
                                        {periodeDetail.rating_perilaku_kerja?.toUpperCase() || 'BELUM DINILAI'}
                                    </Text>
                                </div>
                                {isPenilai && <ActionIcon disabled={isLocked} variant='light' onClick={ratingPerilakuModalHandlers.open}><IconEdit size={16}/></ActionIcon>}
                                </Group>
                        </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                        <Table.Td colSpan={4}>
                            <Group align="center">
                                <div style={{ minWidth: 200 }}>
                                    <Text size="xs" c="dimmed" fw={700}>PREDIKAT KINERJA PEGAWAI:</Text>
                                    <Text size="sm" fw={500}>
                                        {periodeDetail.predikat_kinerja?.toUpperCase() || 'BELUM DINILAI'} {/* <-- BENAR */}
                                    </Text>
                                </div>
                                {isPenilai && <ActionIcon disabled={isLocked} variant='light' onClick={predikatModalHandlers.open}><IconEdit size={16}/></ActionIcon>}
                            </Group>
                        </Table.Td>
                    </Table.Tr>
                </Table.Tfoot>
                </Table>
            </Paper>
            {isPenilai && (
                <AtasanCatatanForm 
                    periodeDetail={periodeDetail} 
                    onSubmit={handleCatatanSubmit}
                />
            )}
        </>
    );
}