import { z } from 'zod';

// Login
export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

// Category
export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

// Sub Service
export const subServiceSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  basePrice: z.number().positive('Price must be positive'),
  estimatedDuration: z.number().int().positive('Duration must be positive'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

// Service Area
export const serviceAreaSchema = z.object({
  name: z.string().min(2).max(100),
  pincode: z.string().length(6, 'Pincode must be 6 digits').regex(/^\d+$/, 'Invalid pincode'),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  isActive: z.boolean().default(true),
});

// Assign Technician
export const assignTechnicianSchema = z.object({
  technicianId: z.string().min(1, 'Technician is required'),
});

// TypeScript types inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type SubServiceFormData = z.infer<typeof subServiceSchema>;
export type ServiceAreaFormData = z.infer<typeof serviceAreaSchema>;
export type AssignTechnicianFormData = z.infer<typeof assignTechnicianSchema>;
