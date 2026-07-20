'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import type { User } from '@/lib/types';

export default function ProfilePage() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: User }>(endpoints.auth.me);
      return data.data;
    },
  });

  const handleSave = () => toast.success('Profile saved');

  return (
    <div className="space-y-5 fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Profile</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">Your account information and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={me?.name} size="lg" />
            <div>
              <p className="font-semibold text-[#111827]">{me?.name ?? 'Admin'}</p>
              <p className="text-sm text-[#9CA3AF]">{me?.role} · Joined {me?.createdAt ? formatDate(me.createdAt) : '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue={me?.name ?? ''} placeholder="Your name" />
            <Input label="Phone" defaultValue={me?.phone ?? ''} disabled />
            <Input label="Email" defaultValue={me?.email ?? ''} type="email" placeholder="admin@fixhub.in" />
            <Input label="Role" defaultValue={me?.role ?? 'ADMIN'} disabled />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            Password management is handled via OTP-based authentication. Use the login screen to re-authenticate.
          </p>
          <Button
            variant="danger"
            onClick={() => {
              localStorage.removeItem('fixhub_admin_token');
              window.location.href = '/login';
            }}
          >
            Sign Out All Sessions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
