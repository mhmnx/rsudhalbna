// src/components/skp/AtasanApprovalForm.tsx
import { Paper, Title, Textarea, Button, Group, Select } from '@mantine/core';
import { useForm } from '@mantine/form';

// Tipe data untuk nilai form
export interface ApprovalFormValues {
    keputusan: 'Persetujuan' | 'Ditolak' | '';
    catatan_penilai: string;
}

interface ApprovalFormProps {
    onSubmit: (values: ApprovalFormValues) => void;
    loading: boolean;
}

export function AtasanApprovalForm({ onSubmit, loading }: ApprovalFormProps) {
    const form = useForm<ApprovalFormValues>({
        initialValues: { keputusan: '', catatan_penilai: '' },
        validate: {
            keputusan: (value) => (value ? null : 'Keputusan harus dipilih'),
            // Tambahkan validasi: catatan wajib jika ditolak
            catatan_penilai: (value, values) => (values.keputusan === 'Ditolak' && !value ? 'Alasan penolakan wajib diisi' : null),
        }
    });

    return (
        <Paper withBorder p="md" radius="md" mt="lg" shadow="sm">
            <Title order={4} mb="md">Formulir Persetujuan</Title>
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Select
                    label="Keputusan"
                    placeholder="Pilih keputusan Anda"
                    data={[
                        { value: 'Persetujuan', label: 'Setujui SKP' },
                        { value: 'Ditolak', label: 'Tolak SKP' },
                    ]}
                    required
                    {...form.getInputProps('keputusan')}
                />
                <Textarea
                    mt="md"
                    label="Catatan/Feedback Penilai"
                    placeholder="Berikan catatan persetujuan atau alasan penolakan..."
                    autosize
                    minRows={3}
                    {...form.getInputProps('catatan_penilai')}
                />
                <Group justify="flex-end" mt="md">
                    <Button type="submit" loading={loading}>
                        Kirim Keputusan
                    </Button>
                </Group>
            </form>
        </Paper>
    );
}