'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart2,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  Shield,
  Tag,
  Users,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ElementType;
  group: string;
  keywords?: string[];
}

const commandItems: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'Navigation' },
  { id: 'bookings', label: 'Bookings', href: '/bookings', icon: BookOpen, group: 'Navigation', keywords: ['orders'] },
  { id: 'technicians', label: 'Technicians', href: '/technicians', icon: Wrench, group: 'Navigation', keywords: ['workers', 'staff'] },
  { id: 'customers', label: 'Customers', href: '/customers', icon: Users, group: 'Navigation', keywords: ['users', 'clients'] },
  { id: 'categories', label: 'Categories', href: '/categories', icon: Tag, group: 'Catalog' },
  { id: 'service-areas', label: 'Service Areas', href: '/service-areas', icon: MapPin, group: 'Catalog', keywords: ['zones', 'locations'] },
  { id: 'payments', label: 'Payments', href: '/payments', icon: CreditCard, group: 'Finance', keywords: ['transactions', 'refunds'] },
  { id: 'reports', label: 'Reports', href: '/reports', icon: BarChart2, group: 'Finance', keywords: ['analytics', 'export'] },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings, group: 'System', keywords: ['config', 'preferences'] },
  { id: 'audit-logs', label: 'Audit Logs', href: '/audit-logs', icon: Shield, group: 'System', keywords: ['history', 'changes'] },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return commandItems;
    const q = query.toLowerCase();
    return commandItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.includes(q)),
    );
  }, [query]);

  const grouped = React.useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      const existing = groups.get(item.group) ?? [];
      groups.set(item.group, [...existing, item]);
    });
    return groups;
  }, [filtered]);

  const flatItems = filtered;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const item = flatItems[selectedIndex];
      if (item) {
        router.push(item.href);
        onClose();
      }
    }
  };

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5 fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-3">
          <Search className="h-4 w-4 flex-shrink-0 text-[#9CA3AF]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
            placeholder="Search anything... (type to filter)"
          />
          <kbd className="rounded border border-[#E5E7EB] px-1.5 py-0.5 text-[10px] text-[#9CA3AF]">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {grouped.size === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No results found.</div>
          ) : (
            Array.from(grouped.entries()).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{group}</span>
                </div>
                {items.map((item) => {
                  const globalIndex = flatItems.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { router.push(item.href); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        globalIndex === selectedIndex
                          ? 'bg-[#F8F8F7] text-[#111827]'
                          : 'text-[#374151] hover:bg-[#F8F8F7]',
                      )}
                    >
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg',
                        globalIndex === selectedIndex ? 'bg-[#1F2937] text-white' : 'bg-[#F3F4F6] text-[#6B7280]',
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-[#E5E7EB] px-4 py-2.5">
          {[
            { keys: ['↑', '↓'], label: 'Navigate' },
            { keys: ['↵'], label: 'Open' },
            { keys: ['Esc'], label: 'Close' },
          ].map(({ keys, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              {keys.map((k) => (
                <kbd key={k} className="rounded border border-[#E5E7EB] px-1 py-0.5 text-[10px] text-[#9CA3AF]">{k}</kbd>
              ))}
              <span className="text-[10px] text-[#9CA3AF]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
