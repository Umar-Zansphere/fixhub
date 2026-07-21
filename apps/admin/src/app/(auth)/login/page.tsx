'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Button, Input } from '@/components/ui';
import { Zap } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiClient.post(endpoints.auth.adminLogin, data);
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success('Logged in successfully');
      router.push('/');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Invalid credentials. Please try again.');
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F8F7]">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="card p-8">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F2937] shadow-md">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-[#111827]">FixHub Admin</h1>
              <p className="mt-0.5 text-sm text-[#9CA3AF]">Operations Console</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Sign in</h2>
              <p className="mt-0.5 text-sm text-[#6B7280]">Enter your admin credentials</p>
            </div>
            <Input
              label="Email Address"
              placeholder="admin@fixhub.in"
              type="email"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              type="password"
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />
            <Button
              type="submit"
              className="w-full"
              loading={loginMutation.isPending}
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#9CA3AF]">
          FixHub Admin Panel · Restricted access
        </p>
      </div>
    </div>
  );
}
