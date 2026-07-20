'use client';

import * as React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Tabs } from '@/components/ui';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [tab, setTab] = React.useState('business');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('Settings saved');
  };

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
          { id: 'working-hours', label: 'Working Hours' },
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
              <Input label="Business Name" defaultValue="FixHub" />
              <Input label="Support Phone" defaultValue="+91 98765 43210" />
              <Input label="Support Email" defaultValue="support@fixhub.in" type="email" />
              <Input label="GST Number" defaultValue="33AABCF1234A1Z5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#374151]">Business Address</label>
              <textarea
                className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6F7F5F33]"
                rows={3}
                defaultValue="123, Service Street, Kolathur, Chennai — 600099, Tamil Nadu"
              />
            </div>
            <div className="flex justify-end">
              <Button loading={saving} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'pricing' && (
        <Card>
          <CardHeader><CardTitle>Pricing Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Platform Fee (%)" type="number" defaultValue="10" />
              <Input label="Minimum Booking Amount (₹)" type="number" defaultValue="199" />
              <Input label="Emergency Surcharge (%)" type="number" defaultValue="25" />
              <Input label="Night Surcharge (%)" type="number" defaultValue="15" />
            </div>
            <div className="flex justify-end">
              <Button loading={saving} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'cancellation' && (
        <Card>
          <CardHeader><CardTitle>Cancellation Policy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Free Cancellation Window (hours)" type="number" defaultValue="2" />
              <Input label="Late Cancellation Fee (₹)" type="number" defaultValue="100" />
              <Input label="No-show Fee (₹)" type="number" defaultValue="200" />
              <Input label="Max Reschedules per Booking" type="number" defaultValue="2" />
            </div>
            <div className="flex justify-end">
              <Button loading={saving} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'working-hours' && (
        <Card>
          <CardHeader><CardTitle>Working Hours</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium text-[#374151]">{day}</span>
                  <Input type="time" defaultValue="08:00" className="w-32" />
                  <span className="text-sm text-[#9CA3AF]">to</span>
                  <Input type="time" defaultValue={day === 'Sunday' ? '14:00' : '20:00'} className="w-32" />
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-xs text-[#9CA3AF]">Active</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button loading={saving} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'payment' && (
        <Card>
          <CardHeader><CardTitle>Payment Gateway</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Razorpay Key ID" defaultValue="rzp_live_••••••••••••" />
              <Input label="Razorpay Key Secret" type="password" defaultValue="••••••••••••••••" />
            </div>
            <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3">
              <p className="text-sm font-medium text-[#15803D]">✓ Payment gateway is active and configured</p>
              <p className="text-xs text-[#16A34A] mt-0.5">Last verified: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex justify-end">
              <Button loading={saving} onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
