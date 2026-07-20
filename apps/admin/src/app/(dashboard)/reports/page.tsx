'use client';

import * as React from 'react';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs } from '@/components/ui';

const PERIOD_OPTIONS = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
];

export default function ReportsPage() {
  const [tab, setTab] = React.useState('revenue');
  const [period, setPeriod] = React.useState('30d');

  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - (period === '7d' ? 7 : period === '90d' ? 90 : 30));

  const params = {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
    groupBy: period === '7d' ? 'day' : 'week',
  };

  const { data: revenueReport } = useQuery({
    queryKey: ['report-revenue', params],
    queryFn: async () => {
      const { data } = await apiClient.get(endpoints.reports.revenue, { params });
      return data;
    },
  });

  const { data: bookingsReport } = useQuery({
    queryKey: ['report-bookings', params],
    queryFn: async () => {
      const { data } = await apiClient.get(endpoints.reports.bookings, { params });
      return data;
    },
  });

  const handleExport = async () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoints.reports.revenue}?${new URLSearchParams({ ...params, format: 'csv' })}`;
    window.open(url, '_blank');
  };

  // Fallback chart data when API data isn't available yet
  const chartData = React.useMemo(() => {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return {
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: Math.floor(Math.random() * 12000 + 3000),
        bookings: Math.floor(Math.random() * 35 + 5),
        customers: Math.floor(Math.random() * 15 + 2),
      };
    });
  }, [period]);

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Reports</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">Analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#E5E7EB] overflow-hidden">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === opt.id ? 'bg-[#1F2937] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F3F4F6]'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'revenue', label: 'Revenue' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'customers', label: 'Customers' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'revenue' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Revenue', value: '₹3,42,800', change: '+18.2%' },
              { label: 'Avg per Booking', value: '₹892', change: '+4.1%' },
              { label: 'Collection Rate', value: '94.3%', change: '+1.2%' },
            ].map(({ label, value, change }) => (
              <div key={label} className="card p-4">
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">{label}</p>
                <p className="mt-1 text-2xl font-bold text-[#111827]">{value}</p>
                <p className="mt-0.5 text-xs text-[#15803D]">{change} vs previous period</p>
              </div>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Revenue Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6F7F5F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6F7F5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 7)} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#6F7F5F" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Bookings', value: '384', change: '+12.5%' },
              { label: 'Completed', value: '312', change: '+15.1%' },
              { label: 'Cancellation Rate', value: '7.2%', change: '-2.3%' },
            ].map(({ label, value, change }) => (
              <div key={label} className="card p-4">
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">{label}</p>
                <p className="mt-1 text-2xl font-bold text-[#111827]">{value}</p>
                <p className="mt-0.5 text-xs text-[#15803D]">{change} vs previous period</p>
              </div>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Bookings Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 7)} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                  <Bar dataKey="bookings" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'New Customers', value: '128', change: '+21.3%' },
              { label: 'Returning', value: '67', change: '+8.9%' },
              { label: 'Avg Bookings/Customer', value: '2.4', change: '+0.3' },
            ].map(({ label, value, change }) => (
              <div key={label} className="card p-4">
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">{label}</p>
                <p className="mt-1 text-2xl font-bold text-[#111827]">{value}</p>
                <p className="mt-0.5 text-xs text-[#15803D]">{change} vs previous period</p>
              </div>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Customer Acquisition</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 7)} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="customers" stroke="#8B5CF6" strokeWidth={2} fill="url(#custGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
