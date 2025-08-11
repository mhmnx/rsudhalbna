// src/components/skp/RhkModal.tsx
import { Modal, Button, Textarea, TextInput, Select, SegmentedControl } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { RhkPayload } from '../../api/skpService';

interface RhkModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: RhkPayload) => void;
    initialData?: any;
}

export function RhkModal({ opened, onClose, onSubmit, initialData }: RhkModalProps) {
    const form = useForm({
        initialValues: {
            deskripsi: initialData?.deskripsi || '',
            intervensi_atasan_text: initialData?.intervensi_atasan_text || '',
            aspek: initialData?.aspek || 'Kuantitas',
            jenis_rhk: initialData?.jenis_rhk || 'Utama', // <-- TAMBAHKAN INI
            indikator_deskripsi: initialData?.indikator_list?.[0]?.deskripsi || '',
            indikator_target: initialData?.indikator_list?.[0]?.target || '',
        },
    });

    useEffect(() => {
        if (initialData) {
            form.setValues({
                deskripsi: initialData.deskripsi,
                intervensi_atasan_text: initialData.intervensi_atasan_text,
                aspek: initialData.aspek,
                jenis_rhk: initialData.jenis_rhk, // <-- TAMBAHKAN INI
                indikator_deskripsi: initialData.indikator_list?.[0]?.deskripsi || '',
                indikator_target: initialData.indikator_list?.[0]?.target || '',
            });
        } else {
            form.reset();
        }
    }, [initialData]);

    const handleSubmit = (values: typeof form.values) => {
        const payload: Omit<RhkPayload, 'skp'> = {
            deskripsi: values.deskripsi,
            intervensi_atasan_text: values.intervensi_atasan_text,
            aspek: values.aspek,
            jenis_rhk: values.jenis_rhk as 'Utama' | 'Tambahan', // <-- TAMBAHKAN INI
            indikator_list: [{
                deskripsi: values.indikator_deskripsi,
                target: values.indikator_target,
            }]
        };
        onSubmit(payload as RhkPayload);
    };

    return (
        <Modal opened={opened} onClose={onClose} title={initialData ? "Edit RHK" : "Tambah RHK"} size="lg">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                {/* TAMBAHKAN PILIHAN JENIS RHK DI SINI */}
                <SegmentedControl
                    fullWidth
                    data={['Utama', 'Tambahan']}
                    {...form.getInputProps('jenis_rhk')}
                    mb="md"
                />

                <Textarea label="Rencana Hasil Kerja Pimpinan yang Diintervensi" {...form.getInputProps('intervensi_atasan_text')} />
                <Textarea mt="md" label="Rencana Hasil Kerja" required {...form.getInputProps('deskripsi')} />
                <Select mt="md" label="Aspek" data={['Kuantitas', 'Kualitas', 'Waktu', 'Biaya']} required {...form.getInputProps('aspek')} />  
                <Textarea label="Indikator" required {...form.getInputProps('indikator_deskripsi')} />
                <TextInput mt="md" label="Target Tahunan" required {...form.getInputProps('indikator_target')} />
                
                <Button type="submit" mt="xl" fullWidth>Simpan</Button>
            </form>
        </Modal>
    );
}