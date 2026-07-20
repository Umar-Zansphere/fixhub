'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Send, Bell } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@/components/ui';

const notifSchema = z.object({
  title: z.string().min(3, 'Title required'),
  body: z.string().min(5, 'Message required'),
  type: z.string(),
  audience: z.string(),
});
type NotifForm = z.infer<typeof notifSchema>;

const TYPE_OPTIONS = [
  { label: 'System', value: 'SYSTEM' },
  { label: 'Promotional', value: 'PROMOTIONAL' },
  { label: 'Booking Update', value: 'BOOKING_UPDATE' },
];

const AUDIENCE_OPTIONS = [
  { label: 'All Users', value: 'all' },
  { label: 'Customers Only', value: 'customers' },
  { label: 'Technicians Only', value: 'technicians' },
];

const TEMPLATES = [
  { label: 'Promo — 20% Off', title: '🎉 Special Offer!', body: 'Get 20% off on your next service booking. Use code FIXHUB20.' },
  { label: 'System Maintenance', title: '🔧 Scheduled Maintenance', body: 'FixHub will be unavailable on Sunday 2–4 AM for system maintenance.' },
  { label: 'New Area Launch', title: '📍 We\'re Now in Your Area!', body: 'FixHub services are now available in your locality. Book now!' },
];

export default function NotificationsPage() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
    defaultValues: { title: '', body: '', type: 'SYSTEM', audience: 'all' },
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: NotifForm) => {
      const { data } = await apiClient.post(endpoints.notifications.send, {
        title: payload.title,
        body: payload.body,
        type: payload.type,
        // audience would be mapped to userIds in real implementation
      });
      return data;
    },
    onSuccess: () => toast.success('Notification queued for delivery'),
    onError: () => toast.error('Failed to send notification'),
  });

  const onSubmit = (values: NotifForm) => sendMutation.mutate(values);

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Notifications</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">Broadcast push notifications to users</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Composer */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
            <Bell className="h-4 w-4 text-[#9CA3AF]" />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select label="Type" options={TYPE_OPTIONS} {...register('type')} />
                <Select label="Target Audience" options={AUDIENCE_OPTIONS} {...register('audience')} />
              </div>
              <Input label="Title" placeholder="Notification title..." error={errors.title?.message} {...register('title')} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#374151]">Message</label>
                <textarea
                  className="min-h-[100px] w-full resize-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6F7F5F33]"
                  placeholder="Notification body text..."
                  {...register('body')}
                />
                {errors.body && <p className="text-xs text-[#EF4444]">{errors.body.message}</p>}
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-[#E5E7EB] p-4 bg-[#F8F8F7]">
                <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-2">Preview</p>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1F2937]">
                    <span className="text-lg">⚡</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{watch('title') || 'Notification Title'}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{watch('body') || 'Your message will appear here...'}</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={sendMutation.isPending} leftIcon={<Send className="h-4 w-4" />}>
                Send Notification
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader><CardTitle>Quick Templates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                onClick={() => { setValue('title', tmpl.title); setValue('body', tmpl.body); }}
                className="w-full rounded-lg border border-[#E5E7EB] p-3 text-left hover:border-[#6F7F5F] hover:bg-[#F0F2ED] transition-colors"
              >
                <p className="text-xs font-semibold text-[#111827]">{tmpl.label}</p>
                <p className="mt-0.5 text-[11px] text-[#6B7280] line-clamp-2">{tmpl.body}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
