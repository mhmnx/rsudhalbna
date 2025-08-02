// src/components/penilaian/BuktiDukungModal.tsx
import { Modal, Button, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface Props { opened: boolean; onClose: () => void; onSubmit: (values: any) => void; initialData?: any; }

export function BuktiDukungModal({ opened, onClose, onSubmit, initialData }: Props) {
    const form = useForm({ initialValues: { link_bukti: initialData?.link_bukti || '', deskripsi: initialData?.deskripsi || '' } });
    useEffect(() => { form.setValues(initialData || { link_bukti: '', deskripsi: '' }); }, [initialData]);
    return (
        <Modal opened={opened} onClose={onClose} title={initialData ? "Edit Bukti Dukung" : "Tambah Bukti Dukung"}>
            <form onSubmit={form.onSubmit(
                (values) => onSubmit(values), // Handler jika validasi sukses
                (validationErrors) => console.log('VALIDATION ERRORS:', validationErrors) // Handler jika validasi GAGAL
            )}>
                <TextInput label="Link Bukti Dukung" required {...form.getInputProps('link_bukti')} />
                <TextInput mt="md" label="Deskripsi" {...form.getInputProps('deskripsi')} />
                <Button type="submit" mt="md" fullWidth>Simpan</Button>
            </form>
        </Modal>
    );
}