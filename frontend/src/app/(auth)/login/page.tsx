'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8),
});

const registerSchema = z
  .object({
    fullName: z.string().min(3),
    whatsapp: z.string().min(10),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password tidak sama.',
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      whatsapp: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleLogin = loginForm.handleSubmit(async (values) => {
    try {
      setLoadingLogin(true);
      const response = await api.post<{ user: { hasPin: boolean; role: 'USER' | 'ADMIN' } }>(
        '/auth/login',
        values,
      );
      if (response.user.role === 'ADMIN') {
        window.location.href = '/admin/dashboard';
      } else if (response.user.hasPin) {
        window.location.href = '/setup-pin?mode=verify';
      } else {
        window.location.href = '/setup-pin?mode=create';
      }
      toast.success('Login berhasil.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Login gagal.');
    } finally {
      setLoadingLogin(false);
    }
  });

  const handleRegister = registerForm.handleSubmit(async (values) => {
    try {
      setLoadingRegister(true);
      await api.post('/auth/register', {
        fullName: values.fullName,
        whatsapp: values.whatsapp,
        email: values.email,
        password: values.password,
      });
      toast.success('Register berhasil, lanjut setup PIN.');
      window.location.href = '/setup-pin?mode=create';
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Register gagal.');
    } finally {
      setLoadingRegister(false);
    }
  });

  return (
    <main className="mobile-shell min-h-screen px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6c3aea] text-white">
            <UserRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold">Masuk KiosPay</h1>
          <p className="text-sm text-slate-500">Aplikasi top-up digital dengan pengalaman iOS modern.</p>
        </div>

        <Card className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <CardContent className="space-y-3 p-0 pt-4">
                  <div className="space-y-1">
                    <Label>Email / Username</Label>
                    <Input {...loginForm.register('identifier')} placeholder="email@domain.com" />
                    <p className="text-xs text-red-500">{loginForm.formState.errors.identifier?.message}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input type="password" {...loginForm.register('password')} placeholder="********" />
                    <p className="text-xs text-red-500">{loginForm.formState.errors.password?.message}</p>
                  </div>
                  <Button className="w-full" onClick={handleLogin} loading={loadingLogin}>
                    Masuk
                  </Button>
                </CardContent>
              </TabsContent>

              <TabsContent value="register">
                <CardContent className="space-y-3 p-0 pt-4">
                  <div className="space-y-1">
                    <Label>Nama Lengkap</Label>
                    <Input {...registerForm.register('fullName')} placeholder="Budi Santoso" />
                    <p className="text-xs text-red-500">{registerForm.formState.errors.fullName?.message}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Nomor WhatsApp</Label>
                    <Input {...registerForm.register('whatsapp')} placeholder="+6281234567890" />
                    <p className="text-xs text-red-500">{registerForm.formState.errors.whatsapp?.message}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input {...registerForm.register('email')} placeholder="email@domain.com" />
                    <p className="text-xs text-red-500">{registerForm.formState.errors.email?.message}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input type="password" {...registerForm.register('password')} placeholder="minimal 8 karakter" />
                    <p className="text-xs text-red-500">{registerForm.formState.errors.password?.message}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Konfirmasi Password</Label>
                    <Input
                      type="password"
                      {...registerForm.register('confirmPassword')}
                      placeholder="ulangi password"
                    />
                    <p className="text-xs text-red-500">{registerForm.formState.errors.confirmPassword?.message}</p>
                  </div>
                  <Button className="w-full" onClick={handleRegister} loading={loadingRegister}>
                    Daftar
                  </Button>
                </CardContent>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </motion.div>
    </main>
  );
}
