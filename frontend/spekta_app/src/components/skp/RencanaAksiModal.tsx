// src/components/skp/RencanaAksiModal.tsx
import { Modal, Button, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface Props {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
}

export function RencanaAksiModal({ opened, onClose, onSubmit, initialData }: Props) {
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
        <Modal opened={opened} onClose={onClose} title={initialData ? "Edit Rencana Aksi" : "Tambah Rencana Aksi"}>
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Textarea label="Rencana Aksi" required autosize minRows={3} {...form.getInputProps('deskripsi')} />
                <TextInput mt="md" label="Target" {...form.getInputProps('target')} />
                <Button type="submit" mt="md" fullWidth>Simpan</Button>
            </form>
        </Modal>
    );
}