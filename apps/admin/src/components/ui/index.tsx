'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── Badge ────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  info:    'badge-info',
  neutral: 'badge-neutral',
  accent:  'badge-accent',
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        badgeVariantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:   'bg-[#1F2937] text-white hover:bg-[#111827] focus-visible:ring-[#1F2937]',
  secondary: 'bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] focus-visible:ring-[#6B7280]',
  ghost:     'text-[#374151] hover:bg-[#F3F4F6] focus-visible:ring-[#6B7280]',
  danger:    'bg-[#EF4444] text-white hover:bg-[#DC2626] focus-visible:ring-[#EF4444]',
  outline:   'border border-[#E5E7EB] text-[#374151] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm:   'h-8 px-3 text-xs gap-1.5',
  md:   'h-9 px-4 text-sm gap-2',
  lg:   'h-10 px-5 text-sm gap-2',
  icon: 'h-9 w-9',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="31.416" strokeDashoffset="10" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, leftElement, rightElement, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#374151]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftElement && (
          <div className="absolute left-3 flex items-center text-[#9CA3AF]">{leftElement}</div>
        )}
        <input
          id={inputId}
          className={cn(
            'h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm',
            'placeholder:text-[#9CA3AF] text-[#111827]',
            'focus:outline-none focus:ring-2 focus:ring-[#6F7F5F33] focus:border-[#6F7F5F]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftElement && 'pl-9',
            rightElement && 'pr-9',
            error && 'border-[#EF4444] focus:ring-[#EF444433]',
            className,
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center text-[#9CA3AF]">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[#374151]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827]',
          'focus:outline-none focus:ring-2 focus:ring-[#6F7F5F33] focus:border-[#6F7F5F]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-[#EF4444]',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-[#111827]', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shimmer rounded-md', className)}
      {...props}
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────
interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

const avatarColors = [
  'bg-[#DBEAFE] text-[#1D4ED8]',
  'bg-[#D1FAE5] text-[#065F46]',
  'bg-[#FEF3C7] text-[#92400E]',
  'bg-[#FCE7F3] text-[#9D174D]',
  'bg-[#EDE9FE] text-[#5B21B6]',
  'bg-[#F0F2ED] text-[#4A5E3A]',
];

function getAvatarColor(name?: string | null) {
  if (!name) return avatarColors[0];
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
    : '?';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        avatarSizes[size],
        !src && getAvatarColor(name),
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name ?? 'avatar'} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── Separator ────────────────────────────────────────────
export function Separator({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return (
    <div
      className={cn(
        'bg-[#E5E7EB]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}

// ─── Stat Card ────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label?: string };
  icon?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function StatCard({ title, value, subtitle, trend, icon, className, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn('card p-5', className)}>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }
  const isPositive = (trend?.value ?? 0) >= 0;
  return (
    <div className={cn('card p-5 fade-in', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{title}</p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8F8F7] text-[#6B7280]">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-[#111827]">{value}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {trend && (
          <span className={cn(
            'inline-flex items-center text-xs font-medium',
            isPositive ? 'text-[#15803D]' : 'text-[#B91C1C]',
          )}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
        {subtitle && <span className="text-xs text-[#9CA3AF]">{subtitle}</span>}
      </div>
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  width?: string;
}

export function Dialog({ open, onClose, title, description, children, width = 'max-w-lg' }: DialogProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full rounded-xl bg-white shadow-xl fade-in',
          width,
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="border-b border-[#E5E7EB] px-6 py-4">
            {title && <h2 className="text-base font-semibold text-[#111827]">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-[#6B7280]">{description}</p>}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, width = 'w-[520px]' }: DrawerProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative ml-auto h-full bg-white shadow-2xl slide-in-right flex flex-col',
          width,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          {title && <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ? (
        <div className="mb-4 text-[#D1D5DB]">{icon}</div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3F4F6]">
          <svg className="h-7 w-7 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      {description && <p className="mt-1 text-sm text-[#6B7280]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────
interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-[#E5E7EB]', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-[#1F2937] text-[#111827]'
              : 'border-transparent text-[#6B7280] hover:text-[#374151]',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              activeTab === tab.id ? 'bg-[#1F2937] text-white' : 'bg-[#F3F4F6] text-[#6B7280]',
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
