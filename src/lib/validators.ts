import { z } from 'zod';

// Auth validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.string().default('receptionist'),
  departmentId: z.string().uuid().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

// Entry validators
export const createEntrySchema = z.object({
  title: z.string().optional(),
  body: z.string().min(1, 'Body is required'),
  category: z.string().min(1, 'Category is required'),
  visibleToDepartmentIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateEntrySchema = z.object({
  title: z.string().optional(),
  body: z.string().min(1, 'Body is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  visibleToDepartmentIds: z.array(z.string().uuid()).optional(),
});

// Task validators
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(3).default(2),
  assigneeId: z.string().uuid().optional(),
  assigneeDepartmentId: z.string().uuid().optional(),
  entryId: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
  reminderAt: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  assigneeId: z.string().uuid().optional(),
  assigneeDepartmentId: z.string().uuid().optional(),
  entryId: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
  reminderAt: z.string().datetime().optional(),
});

// Helper schema for nullable department ID with empty string handling
const departmentIdSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform(val => val === '' ? null : val)
  .pipe(
    z.union([z.string().uuid(), z.null(), z.undefined()])
  );

// User validators (admin)
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.string().default('receptionist'),
  departmentId: departmentIdSchema,
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  role: z.string().optional(),
  departmentId: departmentIdSchema,
});

// Department validators (admin)
export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
