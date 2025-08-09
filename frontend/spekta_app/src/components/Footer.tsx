// src/components/Footer.tsx
import { Text, Group } from '@mantine/core';

export function Footer() {
  return (
    <Group justify="space-between" align="center">
      <Text c="dimmed" size="sm">
        © {new Date().getFullYear()} SPEKTA - RSUD Hj. Anna Lasmanah Banjarnegara. All rights reserved.
      </Text>
    </Group>
  );
}