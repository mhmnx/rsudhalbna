// src/components/admin/MasterPerilakuModal.tsx
import { Modal, Button, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface Props {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
}

export function MasterPerilakuModal({ opened, onClose, onSubmit, initialData }: Props) {
    const form = useForm({
        initialValues: {
            jenis_perilaku: initialData?.jenis_perilaku || '',
            uraian_perilaku: initialData?.uraian_perilaku || '',
        },
    });

    useEffect(() => {
        form.setValues(initialData || { jenis_perilaku: '', uraian_perilaku: '' });
    }, [initialData]);

    return (
        <Modal opened={opened} onClose={onClose} title={initialData ? "Edit Master Perilaku" : "Tambah Master Perilaku"}>
            <form onSubmit={form.onSubmit(onSubmit)}>
                <TextInput label="Jenis Perilaku" required {...form.getInputProps('jenis_perilaku')} />
                <Textarea mt="md" label="Uraian Perilaku" required autosize minRows={4} placeholder="Pisahkan setiap poin dengan baris baru (Enter)" {...form.getInputProps('uraian_perilaku')} />
                <Button type="submit" mt="md" fullWidth>Simpan</Button>
            </form>
        </Modal>
    );
}