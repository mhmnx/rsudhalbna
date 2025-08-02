// src/components/skp/EkspektasiModal.tsx
import { Modal, Button, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface EkspektasiModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: { ekspektasi_khusus: string }) => void;
    initialData?: { ekspektasi_khusus: string };
}

export function EkspektasiModal({ opened, onClose, onSubmit, initialData }: EkspektasiModalProps) {
    const form = useForm({
        initialValues: {
            ekspektasi_khusus: initialData?.ekspektasi_khusus || '',
        },
    });

    useEffect(() => {
        form.setValues({ ekspektasi_khusus: initialData?.ekspektasi_khusus || '' });
    }, [initialData]);

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Ekspektasi Khusus Pimpinan">
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Textarea
                    label="Ekspektasi Khusus"
                    placeholder="Deskripsikan ekspektasi Anda..."
                    autosize
                    minRows={4}
                    {...form.getInputProps('ekspektasi_khusus')}
                />
                <Button type="submit" mt="md" fullWidth>
                    Simpan Ekspektasi
                </Button>
            </form>
        </Modal>
    );
}