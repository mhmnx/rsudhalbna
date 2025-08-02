// src/components/skp/IndikatorModal.tsx
import { Modal, Button, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface IndikatorModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
}

export function IndikatorModal({ opened, onClose, onSubmit, initialData }: IndikatorModalProps) {
    const form = useForm({
        initialValues: {
            deskripsi: initialData?.deskripsi || '',
            target: initialData?.target || '',
        },
    });

    useEffect(() => {
        form.setValues(initialData || { deskripsi: '', target: '' });
    }, [initialData]);

    return (
        <Modal opened={opened} onClose={onClose} title={initialData ? "Edit Indikator" : "Tambah Indikator"}>
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Textarea label="Indikator Kinerja" required {...form.getInputProps('deskripsi')} />
                <TextInput mt="md" label="Target Tahunan" required {...form.getInputProps('target')} />
                <Button type="submit" mt="md" fullWidth>Simpan</Button>
            </form>
        </Modal>
    );
}