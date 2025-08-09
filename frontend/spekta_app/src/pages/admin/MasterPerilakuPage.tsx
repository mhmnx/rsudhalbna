// src/pages/admin/MasterPerilakuPage.tsx
import { useState, useEffect } from 'react';
import { Table, Button, Title, Paper, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { fetchMasterPerilaku, MasterPerilaku } from '../../api/masterDataService';
// Anda perlu membuat komponen Modal & Form terpisah, seperti yang kita lakukan untuk SKP

export function MasterPerilakuPage() {
    const [data, setData] = useState<MasterPerilaku[]>([]);
    const [loading, setLoading] = useState(true);

    // Logika untuk fetch data, open/close modal, submit form, delete
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchMasterPerilaku();
                setData(response);
            } catch (error) {
                notifications.show({ color: 'red', message: 'Gagal memuat data master.' });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const rows = data.map((item) => (
        <Table.Tr key={item.id}>
            <Table.Td>{item.jenis_perilaku}</Table.Td>
            <Table.Td style={{ whiteSpace: 'pre-wrap' }}>{item.uraian_perilaku}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Tooltip label="Edit"><ActionIcon variant="light"><IconEdit size={16} /></ActionIcon></Tooltip>
                    <Tooltip label="Hapus"><ActionIcon variant="light" color="red"><IconTrash size={16} /></ActionIcon></Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
                <Title order={3}>Master Perilaku Kerja</Title>
                <Button leftSection={<IconPlus size={16} />}>Tambah Data</Button>
            </Group>
            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Jenis Perilaku</Table.Th>
                        <Table.Th>Uraian</Table.Th>
                        <Table.Th>Aksi</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Paper>
    );
}