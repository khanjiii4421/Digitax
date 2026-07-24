import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100).trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  number: z
    .string()
    .regex(/^\d{10,11}$/, 'Phone must be 10-11 digits')
    .optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const signinSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

export const adminLoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
  cnic: z
    .string()
    .regex(/^\d{13}$/, 'CNIC must be exactly 13 digits')
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const applicationSchema = z.object({
  service_type: z.string().optional(),
  category: z.string().optional(),
  form_data: z.record(z.unknown()).optional(),
  cnic_front_url: z.string().url().optional().nullable(),
  cnic_back_url: z.string().url().optional().nullable(),
  selfie_url: z.string().url().optional().nullable(),
  payment_method: z.string().optional(),
  amount: z.number().positive().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

export const notificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().optional(),
  type: z.enum(['info', 'success', 'warning', 'error']).optional().default('info'),
  link: z.string().optional(),
});

export const querySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  subject: z.string().optional().max(500),
  message: z.string().min(1, 'Message is required').max(5000),
});

export const adminCreateUserSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  number: z.string().optional(),
  password: z.string().min(6).max(128),
  role: z.enum(['user', 'admin']).optional().default('user'),
});

export const settingsSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.string(),
  type: z.enum(['string', 'json', 'number', 'boolean']).optional().default('string'),
});
