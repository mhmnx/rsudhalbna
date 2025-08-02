// src/components/penilaian/RealisasiModal.tsx
import { Modal, Button, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface Props { opened: boolean; onClose: () => void; onSubmit: (values: any) => void; initialData?: any; }

export function RealisasiModal({ opened, onClose, onSubmit, initialData }: Props) {
    const form = useForm({
        initialValues: {
            realisasi: initialData?.realisasi || '',
            dasar_realisasi: initialData?.dasar_realisasi || '' // <-- TAMBAHKAN INI
        },
    });
    useEffect(() => { form.setValues({
        realisasi: initialData?.realisasi || '',
        dasar_realisasi: initialData?.dasar_realisasi || '' // <-- TAMBAHKAN INI
    }); }, [initialData]);

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Realisasi">
            <form onSubmit={form.onSubmit(
                (values) => onSubmit(values), // Handler jika validasi sukses
                (validationErrors) => console.log('VALIDATION ERRORS:', validationErrors) // Handler jika validasi GAGAL
            )}>
                <Textarea label="Realisasi" autosize minRows={4} {...form.getInputProps('realisasi')} />
                <Textarea mt="md" label="Berdasarkan" placeholder="Contoh: Hasil wawancara, data primer, dll." autosize minRows={2} {...form.getInputProps('dasar_realisasi')} />
                <Button type="submit" mt="md" fullWidth>Simpan Realisasi</Button>
            </form>
        </Modal>
    );
}