// src/components/skp/LampiranModal.tsx
import { Modal, Button, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { LampiranPayload } from '../../api/skpService';

interface LampiranModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: LampiranPayload) => void;
    initialData?: LampiranPayload | null;
}

export function LampiranModal({ opened, onClose, onSubmit, initialData }: LampiranModalProps) {
    const form = useForm<LampiranPayload>({
        // PERBAIKAN: Use empty string '' as fallback for null/undefined
        initialValues: {
            dukungan_sumber_daya: initialData?.dukungan_sumber_daya || '',
            skema_pertanggungjawaban: initialData?.skema_pertanggungjawaban || '',
            konsekuensi: initialData?.konsekuensi || '',
        },
    });

    useEffect(() => {
        // PERBAIKAN: Also use empty string '' as fallback here
        form.setValues({
            dukungan_sumber_daya: initialData?.dukungan_sumber_daya || '',
            skema_pertanggungjawaban: initialData?.skema_pertanggungjawaban || '',
            konsekuensi: initialData?.konsekuensi || '',
        });
    }, [initialData]);

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Lampiran" size="lg">
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Textarea label="Dukungan Sumber Daya" autosize minRows={3} {...form.getInputProps('dukungan_sumber_daya')} />
                <Textarea mt="md" label="Skema Pertanggungjawaban" autosize minRows={3} {...form.getInputProps('skema_pertanggungjawaban')} />
                <Textarea mt="md" label="Konsekuensi" autosize minRows={3} {...form.getInputProps('konsekuensi')} />
                <Button type="submit" mt="xl" fullWidth>Simpan Lampiran</Button>
            </form>
        </Modal>
    );
}