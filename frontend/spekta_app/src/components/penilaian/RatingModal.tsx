// src/components/penilaian/RatingModal.tsx
import { Modal, Button, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface Props {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    title: string;
    fieldName: string;
    data: string[]; // Daftar pilihan
    initialValue: string;
}

export function RatingModal({ opened, onClose, onSubmit, title, fieldName, data, initialValue }: Props) {
    const form = useForm({
        initialValues: {
            [fieldName]: initialValue || '',
        },
    });

    useEffect(() => {
        form.setFieldValue(fieldName, initialValue || '');
    }, [initialValue, fieldName]);

    return (
        <Modal opened={opened} onClose={onClose} title={title}>
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Select
                    label="Rating / Predikat"
                    required
                    data={data}
                    {...form.getInputProps(fieldName)}
                />
                <Button type="submit" mt="xl" fullWidth>Simpan</Button>
            </form>
        </Modal>
    );
}