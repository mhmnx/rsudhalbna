// src/components/penilaian/TambahPeriodeModal.tsx
import { Modal, Button, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { SKP, PeriodePenilaian, AddPeriodPayload } from '../../api/skpService';
import { startOfMonth, endOfMonth, eachMonthOfInterval, isAfter, parseISO } from 'date-fns';

interface Props {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: AddPeriodPayload) => void;
    skp: SKP;
}

export function TambahPeriodeModal({ opened, onClose, onSubmit, skp }: Props) {
    const form = useForm<{ periode: string }>({
        initialValues: { periode: '' },
        validate: { periode: (val) => val ? null : 'Periode harus dipilih' }
    });

    // Logika untuk menghasilkan daftar bulan yang valid
    const getAvailableMonths = () => {
        const today = new Date();
        const skpStartDate = parseISO(skp.periode_awal);
        const skpEndDate = parseISO(skp.periode_akhir);
        const existingPeriods = skp.periode_penilaian_list.map(p => startOfMonth(parseISO(p.tanggal_awal)).getTime());

        // Tentukan rentang: dari awal SKP hingga hari ini (atau akhir SKP, mana yang lebih dulu)
        const rangeEnd = isAfter(today, skpEndDate) ? skpEndDate : today;

        const monthsInRange = eachMonthOfInterval({ start: skpStartDate, end: rangeEnd });

        return monthsInRange
            .filter(month => !existingPeriods.includes(month.getTime()))
            .map(month => ({
                value: `${month.getFullYear()}-${month.getMonth() + 1}`, // Format YYYY-M
                label: month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
            }));
    };

    const handleSubmit = (values: { periode: string }) => {
        const [year, month] = values.periode.split('-').map(Number);
        onSubmit({ year, month });
    };

    const availableMonths = getAvailableMonths();

    return (
        <Modal opened={opened} onClose={onClose} title="Tambah Periode Penilaian">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                {availableMonths.length > 0 ? (
                    <Select
                        label="Pilih Periode"
                        placeholder="Pilih bulan yang akan ditambahkan"
                        data={availableMonths}
                        required
                        {...form.getInputProps('periode')}
                    />
                ) : (
                    <p>Semua periode yang valid telah ditambahkan.</p>
                )}
                <Button type="submit" mt="md" fullWidth disabled={availableMonths.length === 0}>
                    Tambah
                </Button>
            </form>
        </Modal>
    );
}