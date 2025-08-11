// src/components/AppLayout.tsx
import React from 'react';
import { AppShell, Burger, Group, NavLink, Menu, Button, Text, MenuDropdown } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconGauge, IconFileText, IconUsers, IconLogout, IconSettings, IconChecklist, IconFileTextSpark, IconUserStar } from '@tabler/icons-react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Impor hook auth kita
import { Footer } from './Footer';

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout } = useAuth(); // Ambil data user dan fungsi logout

  const renderNavLinks = () => {
    // Tampilkan menu berdasarkan role
    if (user?.role === 'ADMIN') {
      return (
        <>
          <NavLink component={RouterNavLink} to="/dashboard" label="Dashboard" leftSection={<IconGauge style={{ color: 'blue' }} size="1rem" stroke={1.5} />} />
          <NavLink
                label="Data Master"
                leftSection={<IconSettings size="1rem" stroke={1.5} style={{ color: 'blue' }} />}
              >
                {/* Isi dari dropdown */}
                <NavLink component={RouterNavLink} to="/data-master/perilaku-kerja" label="Master Perilaku Kerja" />
                {/* Anda bisa menambahkan link data master lainnya di sini */}
                {/* Contoh: <NavLink component={RouterNavLink} to="/data-master/jabatan" label="Master Jabatan" /> */}
              </NavLink>        </>
      );
    }

    // Menu untuk Pegawai dan Atasan
    return (
      <>
        {user?.role === 'ATASAN' && (
        <NavLink component={RouterNavLink} to="/dashboard" label="Dashboard" leftSection={<IconGauge style={{ color: 'blue' }} size="1rem" stroke={1.5} />} />
        )}
        {user?.role !== 'ATASAN' && (
        <>
        <NavLink component={RouterNavLink} to="/dashboard" label="Dashboard" leftSection={<IconGauge style={{ color: 'blue' }} size="1rem" stroke={1.5} />} />
        <NavLink component={RouterNavLink} to="/skp" label="SKP Saya" leftSection={<IconFileText style={{ color: 'blue' }} size="1rem" stroke={1.5} />} />
        </>
        )}
        <NavLink component={RouterNavLink} to="/tim-kerja" label="Tim Kerja" leftSection={<IconUsers style={{ color: 'blue' }} size="1rem" stroke={1.5} />} />
        {/* Menu tambahan khusus Atasan */}
        {user?.role === 'ATASAN' && (
          <>
            <NavLink component={RouterNavLink} to="/persetujuan" label="Persetujuan SKP" leftSection={<IconChecklist style={{ color: 'blue' }} size="1rem" stroke={1.5} />} />
            <NavLink component={RouterNavLink} to="/penilaian" label="Penilaian SKP" leftSection={<IconFileTextSpark style={{ color: 'blue' }} size="1rem" stroke={1.5} />} />
          </>
        )}
      </>
    );
  };

  const renderUserMenu = () => {
    if (user?.role === 'ADMIN') {
        return <Button onClick={logout} leftSection={<IconLogout size={14} />}>Logout</Button>;
    }

    // Menu untuk Pegawai dan Atasan
    return (
        <Menu shadow="md" width={200}>
            <Menu.Target>
                <Button variant="default">{user?.nama_lengkap || 'Pengguna'}</Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label>Akun</Menu.Label>
                <Menu.Item leftSection={<IconSettings size={14} />}>
                    Profil Saya
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={logout}>
                    Logout
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
  };

  return (
    <AppShell
      // Atur tinggi minimal agar AppShell selalu seukuran layar
      style={{ minHeight: '100vh' }}
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      footer={{ height: 60 }} // Alokasikan 60px untuk footer
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700}>SPEKTA RSUD</Text>
          </Group>
          {renderUserMenu()}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {renderNavLinks()}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
      <AppShell.Footer p="md">
        <Footer />
      </AppShell.Footer>

    </AppShell>
  );
}