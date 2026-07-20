'use client';

import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Bell, ChevronRight, Search } from 'lucide-react';

import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/bookings': 'Bookings',
  '/technicians': 'Technicians',
  '/customers': 'Customers',
  '/categories': 'Categories',
  '/services': 'Services',
  '/service-areas': 'Service Areas',
  '/payments': 'Payments',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/audit-logs': 'Audit Logs',
  '/profile': 'Profile',
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-sm font-semibold text-[#111827]">Dashboard</span>;
  }

  const crumbs: { label: string; href: string }[] = [
    { label: 'FixHub', href: '/' },
  ];

  let acc = '';
  segments.forEach((seg) => {
    acc += `/${seg}`;
    const label = routeLabels[acc] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    crumbs.push({ label, href: acc });
  });

  return (
    <div className="flex items-center gap-1.5">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />}
          <span
            className={cn(
              'text-sm',
              i === crumbs.length - 1
                ? 'font-semibold text-[#111827]'
                : 'text-[#6B7280] hover:text-[#374151]',
            )}
          >
            {crumb.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

interface HeaderProps {
  onCommandPalette?: () => void;
}

export function Header({ onCommandPalette }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
      {/* Left — Breadcrumb */}
      <Breadcrumb />

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          onClick={onCommandPalette}
          className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8F8F7] px-3 py-1.5 text-sm text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden rounded bg-white px-1 py-0.5 text-[10px] font-medium text-[#9CA3AF] shadow-sm border border-[#E5E7EB] sm:inline">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-[#E5E7EB]" />

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1F2937] text-[11px] font-bold text-white">
            A
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-[#111827]">Admin</div>
            <div className="text-[10px] text-[#9CA3AF]">admin@fixhub.in</div>
          </div>
        </div>
      </div>
    </header>
  );
}
