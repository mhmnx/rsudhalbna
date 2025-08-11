// src/pages/LoginPage.tsx
import { TextInput, PasswordInput, Button, Paper, Title, Container, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import axiosInstance from '../api/axiosInstance';
import { useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

import { useAuth } from '../context/AuthContext'; // Impor useAuth


// Definisikan tipe untuk data form
interface FormValues {
  email: string;
  password: string;
}

export function LoginPage() {

  // Definisikan tipe untuk state error
  const { login } = useAuth(); // Gunakan context
  const [error, setError] = useState<string | null>(null); 

  // Beri tahu useForm tentang bentuk data kita
  const form = useForm<FormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email tidak valid'),
    },
  });

  // Beri tipe pada 'values' yang diterima oleh handler
  const handleSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const response = await axiosInstance.post('/auth/token/', values);
      // Panggil fungsi login dari context dengan access token
      login(response.data.access);
      // Simpan refresh token secara manual
      localStorage.setItem('refresh_token', response.data.refresh);
    } catch (err) {
      console.error('Login Gagal:', err);
      setError('Login gagal. Periksa kembali email dan password Anda.');
    }
  };

  return (
      <Container size={420} my={40}>
          <Title ta="center">SPEKTA</Title>
          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
              {/* onSubmit sekarang lebih aman karena tipe datanya sudah jelas */}
              <form onSubmit={form.onSubmit(handleSubmit)}>
                  {/* ... sisa JSX form tidak berubah ... */}
                  <TextInput label="Email" placeholder="emailanda@rsud.com" required {...form.getInputProps('email')} />
                  <PasswordInput label="Password" placeholder="Password Anda" required mt="md" {...form.getInputProps('password')} />
                  {error && ( <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="md">{error}</Alert>)}
                  <Button fullWidth mt="xl" type="submit">Login</Button>
              </form>
          </Paper>
      </Container>
  );
}