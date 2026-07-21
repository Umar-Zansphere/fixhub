'use client';

import * as React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Tabs } from '@/components/ui';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState('business');
  const [settings, setSettings] = React.useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get(endpoints.admin.settings);
      return res.data;
    },
  });

  React.useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (updatedSettings: Record<string, any>) => {
      const res = await apiClient.patch(endpoints.admin.settings, updatedSettings);
      return res.data;
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['settings'], newData);
      toast.success('Settings saved');
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-[#6B7280]">Loading settings...</div>;
  }

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Settings</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">Platform configuration and business rules</p>
      </div>

      <Tabs
        tabs={[
          { id: 'business', label: 'Business' },
          { id: 'pricing', label: 'Pricing' },
          { id: 'cancellation', label: 'Cancellation' },
          { id: 'payment', label: 'Payment' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'business' && (
        <Card>
          <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Business Name" value={settings.business_name || 'FixHub'} onChange={(e) => handleChange('business_name', e.target.value)} />
              <Input label="Support Phone" value={settings.support_phone || ''} onChange={(e) => handleChange('support_phone', e.target.value)} />
              <Input label="Support Email" type="email" value={settings.support_email || ''} onChange={(e) => handleChange('support_email', e.target.value)} />
              <Input label="GST Number" value={settings.gst_number || ''} onChange={(e) => handleChange('gst_number', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">Business Address</label>
              <textarea
                className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6F7F5F33]"
                rows={3}
                value={settings.business_address || ''}
                onChange={(e) => handleChange('business_address', e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button loading={saveMutation.isPending} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'pricing' && (
        <Card>
          <CardHeader><CardTitle>Pricing Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Platform Fee (%)" type="number" value={settings.platform_fee || ''} onChange={(e) => handleChange('platform_fee', Number(e.target.value))} />
              <Input label="Minimum Booking Amount (₹)" type="number" value={settings.min_booking_amount || ''} onChange={(e) => handleChange('min_booking_amount', Number(e.target.value))} />
              <Input label="Emergency Surcharge (%)" type="number" value={settings.emergency_surcharge || ''} onChange={(e) => handleChange('emergency_surcharge', Number(e.target.value))} />
              <Input label="Night Surcharge (%)" type="number" value={settings.night_surcharge || ''} onChange={(e) => handleChange('night_surcharge', Number(e.target.value))} />
            </div>
            <div className="flex justify-end">
              <Button loading={saveMutation.isPending} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'cancellation' && (
        <Card>
          <CardHeader><CardTitle>Cancellation Policy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Free Cancellation Window (hours)" type="number" value={settings.free_cancellation_hours || ''} onChange={(e) => handleChange('free_cancellation_hours', Number(e.target.value))} />
              <Input label="Late Cancellation Fee (₹)" type="number" value={settings.late_cancellation_fee || ''} onChange={(e) => handleChange('late_cancellation_fee', Number(e.target.value))} />
              <Input label="No-show Fee (₹)" type="number" value={settings.no_show_fee || ''} onChange={(e) => handleChange('no_show_fee', Number(e.target.value))} />
              <Input label="Max Reschedules per Booking" type="number" value={settings.max_reschedules || ''} onChange={(e) => handleChange('max_reschedules', Number(e.target.value))} />
            </div>
            <div className="flex justify-end">
              <Button loading={saveMutation.isPending} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'payment' && (
        <Card>
          <CardHeader><CardTitle>Payment Gateway</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Razorpay Key ID" value={settings.razorpay_key_id || ''} onChange={(e) => handleChange('razorpay_key_id', e.target.value)} />
              <Input label="Razorpay Key Secret" type="password" value={settings.razorpay_key_secret || ''} onChange={(e) => handleChange('razorpay_key_secret', e.target.value)} />
            </div>
            <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
              <p className="text-sm font-medium text-[#15803D]">✓ Payment gateway settings are stored securely</p>
            </div>
            <div className="flex justify-end">
              <Button loading={saveMutation.isPending} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
