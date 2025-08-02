// src/components/penilaian/FeedbackModal.tsx
import { Modal, Button, Select } from '@mantine/core'; // Ubah import
import { useForm } from '@mantine/form';
import { useEffect } from 'react';

interface Props { opened: boolean; onClose: () => void; onSubmit: (values: { feedback_atasan: string }) => void; initialData?: any; }

export function FeedbackModal({ opened, onClose, onSubmit, initialData }: Props) {
    const form = useForm({
        initialValues: { feedback_atasan: initialData?.feedback_atasan || '' },
    });

    useEffect(() => {
        form.setValues({ feedback_atasan: initialData?.feedback_atasan || '' });
    }, [initialData]);

    return (
        <Modal opened={opened} onClose={onClose} title="Beri Feedback Atasan">
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Select
                    label="Feedback"
                    placeholder="Pilih feedback untuk rencana aksi ini"
                    required
                    data={['Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Kurang', 'Sangat Kurang']}
                    {...form.getInputProps('feedback_atasan')}
                />
                <Button type="submit" mt="md" fullWidth>Simpan Feedback</Button>
            </form>
        </Modal>
    );
}