// src/components/penilaian/AtasanCatatanForm.tsx
import { Paper, Title, Textarea, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { PeriodePenilaianDetail } from '../../api/skpService';

interface Props {
    periodeDetail: PeriodePenilaianDetail;
    onSubmit: (values: { capaian_organisasi: string, catatan_rekomendasi: string }) => void;
}

export function AtasanCatatanForm({ periodeDetail, onSubmit }: Props) {
    const form = useForm({
        initialValues: {
            capaian_organisasi: periodeDetail.capaian_organisasi || '',
            catatan_rekomendasi: periodeDetail.catatan_rekomendasi || '',
        },
    });

    useEffect(() => {
        form.setValues({
            capaian_organisasi: periodeDetail.capaian_organisasi || '',
            catatan_rekomendasi: periodeDetail.catatan_rekomendasi || '',
        });
    }, [periodeDetail]);

    return (
        <Paper withBorder p="md" radius="md" mt="lg">
            <Title order={4} mb="md">Catatan dan Rekomendasi Penilai</Title>
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Textarea
                    label="Capaian Kinerja Organisasi"
                    placeholder="Contoh: Baik, Istimewa..."
                    {...form.getInputProps('capaian_organisasi')}
                />
                <Textarea
                    mt="md"
                    label="Catatan / Rekomendasi"
                    placeholder="Tuliskan catatan atau rekomendasi Anda di sini..."
                    autosize
                    minRows={4}
                    {...form.getInputProps('catatan_rekomendasi')}
                />
                <Group justify="flex-end" mt="md">
                    <Button type="submit">Simpan Catatan</Button>
                </Group>
            </form>
        </Paper>
    );
}