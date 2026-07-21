'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Send, Bell } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Tabs } from '@/components/ui';
import { DataTable } from '@/components/data-table/data-table';
import { formatDate } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';

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
  const [tab, setTab] = React.useState('send');
  const [page, setPage] = React.useState(1);
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
    defaultValues: { title: '', body: '', type: 'SYSTEM', audience: 'all' },
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: NotifForm) => {
      const { data } = await apiClient.post(endpoints.notifications.send, {
        title: payload.title,
        body: payload.body,
        type: payload.type,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Notification queued for delivery');
      reset();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to send notification'),
  });

  const onSubmit = (values: NotifForm) => sendMutation.mutate(values);

  // Queries for History
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const { data } = await apiClient.get(endpoints.notifications.list, { params: { page, limit: 20 } });
      return data.data || { items: [], meta: { total: 0 } };
    },
    enabled: tab === 'history',
  });

  const columns: ColumnDef<any, unknown>[] = [
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => <span className="font-semibold text-sm text-[#111827]">{row.original.title}</span>,
      size: 200,
    },
    {
      id: 'body',
      accessorKey: 'body',
      header: 'Message',
      cell: ({ row }) => <span className="text-xs text-[#6B7280] line-clamp-1">{row.original.body}</span>,
      size: 300,
    },
    {
      id: 'type',
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <span className="text-xs text-[#374151]">{row.original.type}</span>,
      size: 100,
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Sent On',
      cell: ({ row }) => <span className="text-xs text-[#9CA3AF]">{formatDate(row.original.createdAt)}</span>,
      size: 120,
    },
  ];

  // Queries for Preferences
  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data } = await apiClient.get(endpoints.notifications.preferences);
      return data;
    },
    enabled: tab === 'preferences',
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (prefs: any) => {
      const { data } = await apiClient.put(endpoints.notifications.preferences, prefs);
      return data;
    },
    onSuccess: () => toast.success('Preferences updated'),
  });

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Notifications</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">Broadcast and manage platform communications</p>
      </div>

      <Tabs
        tabs={[
          { id: 'send', label: 'Send New' },
          { id: 'history', label: 'History' },
          { id: 'preferences', label: 'Preferences' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'send' && (
        <div className="grid gap-5 lg:grid-cols-3">
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
      )}

      {tab === 'history' && (
        <DataTable
          columns={columns}
          data={historyData?.items ?? []}
          loading={historyLoading}
          totalItems={historyData?.meta?.total}
          page={page}
          pageCount={historyData?.meta ? Math.ceil(historyData.meta.total / 20) : 1}
          onPageChange={setPage}
          emptyTitle="No notification history"
          emptyDescription="Sent notifications will appear here."
        />
      )}

      {tab === 'preferences' && (
        <Card>
          <CardHeader><CardTitle>System Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {prefsLoading ? (
              <p className="text-sm text-[#6B7280]">Loading preferences...</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Email Alerts</p>
                    <p className="text-xs text-[#6B7280]">Receive daily digest emails</p>
                  </div>
                  <input type="checkbox" defaultChecked={preferences?.emailAlerts} onChange={(e) => updatePrefsMutation.mutate({ ...preferences, emailAlerts: e.target.checked })} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">SMS Alerts</p>
                    <p className="text-xs text-[#6B7280]">Critical system alerts via SMS</p>
                  </div>
                  <input type="checkbox" defaultChecked={preferences?.smsAlerts} onChange={(e) => updatePrefsMutation.mutate({ ...preferences, smsAlerts: e.target.checked })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
