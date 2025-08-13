// src/pages/admin/MasterPerilakuPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Title, Paper, Group, ActionIcon, Tooltip, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { fetchMasterPerilaku, createMasterPerilaku, MasterPerilaku, MasterPerilakuPayload } from '../../api/masterDataService';
import { MasterPerilakuModal } from './MasterPerilakuModal';

export function MasterPerilakuPage() {
    const [data, setData] = useState<MasterPerilaku[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpened, modalHandlers] = useDisclosure(false);
    const [editingData, setEditingData] = useState<MasterPerilaku | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchMasterPerilaku();
            setData(response);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal memuat data master.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenModal = (item: MasterPerilaku | null) => {
        setEditingData(item);
        modalHandlers.open();
    };

    const handleSubmit = async (values: MasterPerilakuPayload) => {
        try {
            if (editingData) {
                // await updateMasterPerilaku(editingData.id, values);
                notifications.show({ color: 'green', message: 'Data berhasil diperbarui.' });
            } else {
                await createMasterPerilaku(values);
                notifications.show({ color: 'green', message: 'Data berhasil ditambahkan.' });
            }
            modalHandlers.close();
            loadData();
        } catch (error) {
            notifications.show({ color: 'red', message: 'Gagal menyimpan data.' });
        }
    };

    const rows = data.map((item) => (
        <Table.Tr key={item.id}>
            <Table.Td>{item.jenis_perilaku}</Table.Td>
            <Table.Td style={{ whiteSpace: 'pre-wrap' }}>{item.uraian_perilaku}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Tooltip label="Edit"><ActionIcon variant="light" onClick={() => handleOpenModal(item)}><IconEdit size={16} /></ActionIcon></Tooltip>
                    <Tooltip label="Hapus"><ActionIcon variant="light" color="red"><IconTrash size={16} /></ActionIcon></Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));
    return (
        <>
            <MasterPerilakuModal
                opened={modalOpened}
                onClose={modalHandlers.close}
                onSubmit={handleSubmit}
                initialData={editingData}
            />
            <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="md">
                    <Title order={3}>Master Perilaku Kerja</Title>
                    <Button leftSection={<IconPlus size={16} />} onClick={() => handleOpenModal(null)}>
                        Tambah Data
                    </Button>
                </Group>
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Jenis Perilaku</Table.Th>
                            <Table.Th>Uraian</Table.Th>
                            <Table.Th>Aksi</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{loading ? <Table.Tr><Table.Td colSpan={3} ta="center"><Loader/></Table.Td></Table.Tr> : rows}</Table.Tbody>
                </Table>
            </Paper>
        </>
    );
}
