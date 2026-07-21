'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import {
  BarChart2,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  Shield,
  Tag,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Bookings', href: '/bookings', icon: BookOpen },
      { label: 'Technicians', href: '/technicians', icon: Wrench },
      { label: 'Customers', href: '/customers', icon: Users },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Categories', href: '/categories', icon: Tag },
      { label: 'Services', href: '/services', icon: ClipboardList },
      { label: 'Service Areas', href: '/service-areas', icon: MapPin },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Reports', href: '/reports', icon: BarChart2 },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Audit Logs', href: '/audit-logs', icon: Shield },
    ],
  },
];

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(endpoints.auth.logout);
    },
    onSettled: () => {
      // Regardless of success or failure, we clear local storage and redirect
      // to ensure the user is not stuck if the token is already expired.
      localStorage.removeItem('fixhub_admin_token');
      router.push('/login');
    }
  });

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-[#E5E7EB] bg-white transition-all duration-200',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-[#E5E7EB] px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#1F2937]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-sm font-bold text-[#111827] tracking-tight">FixHub</span>
              <span className="ml-1 text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider">Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[54px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] shadow-sm hover:text-[#111827] transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {navGroups.map((group, gi) => (
          <div key={gi} className={cn('mb-1', gi > 0 && 'mt-3')}>
            {group.title && !collapsed && (
              <div className="mb-1 px-2 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  {group.title}
                </span>
              </div>
            )}
            {group.title && !collapsed && gi > 0 && (
              <div className="mb-2 h-px w-full bg-[#F3F4F6]" />
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'nav-item',
                    active && 'active',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-[#1F2937]' : 'text-[#9CA3AF]')} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom — Profile */}
      <div className="border-t border-[#E5E7EB] p-2">
        <Link
          href="/profile"
          className={cn('nav-item', collapsed && 'justify-center')}
        >
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1F2937] text-[10px] font-bold text-white">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-[#111827]">Admin</div>
              <div className="truncate text-[10px] text-[#9CA3AF]">Operations</div>
            </div>
          )}
        </Link>
        <button
          className={cn('nav-item w-full text-[#6B7280] mt-0.5', collapsed && 'justify-center')}
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 flex-shrink-0 text-[#9CA3AF]" />
          {!collapsed && <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign out'}</span>}
        </button>
      </div>
    </aside>
  );
}
