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

const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, 'Enter a valid phone number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = React.useState('');

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: PhoneForm) => {
      const res = await apiClient.post(endpoints.auth.sendOtp, { phone: data.phone });
      return res.data;
    },
    onSuccess: (_, vars) => {
      setPhone(vars.phone);
      setStep('otp');
      toast.success('OTP sent to your phone');
    },
    onError: () => toast.error('Failed to send OTP. Please try again.'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpForm) => {
      const res = await apiClient.post(endpoints.auth.verifyOtp, { phone, otp: data.otp });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.accessToken) {
        localStorage.setItem('fixhub_admin_token', data.data.accessToken);
        router.push('/');
      } else {
        toast.error('Authentication failed. Ensure your account has Admin role.');
      }
    },
    onError: () => toast.error('Invalid OTP. Please try again.'),
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

          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit((d) => sendOtpMutation.mutate(d))} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Sign in</h2>
                <p className="mt-0.5 text-sm text-[#6B7280]">Enter your registered phone number</p>
              </div>
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                type="tel"
                error={phoneForm.formState.errors.phone?.message}
                {...phoneForm.register('phone')}
              />
              <Button
                type="submit"
                className="w-full"
                loading={sendOtpMutation.isPending}
              >
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit((d) => verifyOtpMutation.mutate(d))} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Enter OTP</h2>
                <p className="mt-0.5 text-sm text-[#6B7280]">
                  Sent to <span className="font-medium text-[#374151]">{phone}</span>
                </p>
              </div>
              <Input
                label="6-Digit OTP"
                placeholder="••••••"
                maxLength={6}
                inputMode="numeric"
                error={otpForm.formState.errors.otp?.message}
                {...otpForm.register('otp')}
              />
              <Button type="submit" className="w-full" loading={verifyOtpMutation.isPending}>
                Verify & Sign in
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-[#6B7280]"
                onClick={() => setStep('phone')}
              >
                ← Change phone number
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#9CA3AF]">
          FixHub Admin Panel · Restricted access · Kolathur Pilot
        </p>
      </div>
    </div>
  );
}
