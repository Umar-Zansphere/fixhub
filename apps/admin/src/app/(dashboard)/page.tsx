'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';

import { useDashboard } from '@/lib/api/queries/use-dashboard';
import { formatCurrency, formatDate, formatRelative, bookingStatusVariant, bookingStatusLabel } from '@/lib/utils';
import type { BookingStatus, Booking } from '@/lib/types';
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle, Skeleton, StatCard } from '@/components/ui';

// Charts use data from stats if available, otherwise empty states

// ─── Recent Bookings row ───────────────────────────────────
function BookingRow({ booking }: { booking: Booking }) {
  const status = booking.status as BookingStatus;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar name={booking.customer?.user?.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-[#111827]">
          {booking.customer?.user?.name ?? 'Unknown'}
        </div>
        <div className="truncate text-[11px] text-[#9CA3AF]">
          {booking.subService?.name} · {booking.bookingNumber}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-semibold text-[#111827]">
          {formatCurrency(booking.totalAmount)}
        </div>
        <Badge variant={bookingStatusVariant(status)} className="text-[10px] mt-0.5">
          {bookingStatusLabel(status)}
        </Badge>
      </div>
    </div>
  );
}

// ─── Activity item ────────────────────────────────────────
function ActivityItem({ icon, title, description, time }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]">
          {icon}
        </div>
        <div className="flex-1 w-px bg-[#F3F4F6] mt-1" />
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-xs font-medium text-[#111827]">{title}</p>
        <p className="text-[11px] text-[#9CA3AF]">{description}</p>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{time}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboard();

  // @ts-ignore
  const recentBookings = stats?.recentBookings ?? [];

  return (
    <div className="space-y-6 fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Operations Overview</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings?.toLocaleString() ?? '—'}
          icon={<BookOpen className="h-4 w-4" />}
          trend={{ value: 12.5, label: 'vs last month' }}
          subtitle="all time"
          loading={statsLoading}
        />
        <StatCard
          title="Active Bookings"
          value={stats?.activeBookings?.toLocaleString() ?? '—'}
          icon={<Activity className="h-4 w-4" />}
          subtitle="right now"
          loading={statsLoading}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers?.toLocaleString() ?? '—'}
          icon={<Users className="h-4 w-4" />}
          subtitle="registered"
          loading={statsLoading}
        />
        <StatCard
          title="Total Technicians"
          value={stats?.totalTechnicians?.toLocaleString() ?? '—'}
          icon={<Wrench className="h-4 w-4" />}
          subtitle="on platform"
          loading={statsLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Trend — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
              <TrendingUp className="h-3.5 w-3.5 text-[#22C55E]" />
              Last 30 days
            </div>
          </CardHeader>
          <CardContent>
            {/* @ts-ignore */}
            {stats?.revenueData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                {/* @ts-ignore */}
                <AreaChart data={stats.revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6F7F5F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6F7F5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6F7F5F"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-[#9CA3AF]">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings by Category — 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <span className="text-xs text-[#9CA3AF]">This month</span>
          </CardHeader>
          <CardContent>
            {/* @ts-ignore */}
            {stats?.categoryData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                {/* @ts-ignore */}
                <BarChart data={stats.categoryData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#374151' }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                    formatter={(v: any) => [v, 'Bookings']}
                  />
                  <Bar dataKey="bookings" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {/* @ts-ignore */}
                    {stats.categoryData.map((entry: any) => (
                      <Cell key={entry.name} fill={entry.color || '#6F7F5F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-[#9CA3AF]">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Bookings — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <a href="/bookings" className="text-xs text-[#6F7F5F] hover:underline font-medium">View all →</a>
          </CardHeader>
          <CardContent className="pt-0">
            {statsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#9CA3AF]">No bookings yet</div>
            ) : (
              <div className="divide-y divide-[#F3F4F6]">
                {recentBookings.map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline — 1/3 */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-0">
              {/* @ts-ignore */}
              {stats?.recentActivity?.length > 0 ? (
                /* @ts-ignore */
                stats.recentActivity.map((activity: any, index: number) => (
                  <ActivityItem
                    key={index}
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    title={activity.title}
                    description={activity.description}
                    time={activity.time}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-sm text-[#9CA3AF]">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
