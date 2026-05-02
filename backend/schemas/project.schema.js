import { z } from 'zod';

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional().default(''),
    role: z.string().max(50).optional().default(''),
    assignee: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo')
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    role: z.string().max(50).optional(),
    assignee: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    order: z.number().int().min(0).optional()
});

export const createResourceSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    url: z.string().url('Must be a valid URL').max(2000),
    type: z.enum(['link', 'pdf', 'document', 'image', 'video', 'other']).optional().default('link'),
    description: z.string().max(500).optional().default(''),
    tags: z.array(z.string().max(30)).max(10).optional().default([])
});

export const updateResourceSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    url: z.string().url().max(2000).optional(),
    type: z.enum(['link', 'pdf', 'document', 'image', 'video', 'other']).optional(),
    description: z.string().max(500).optional(),
    tags: z.array(z.string().max(30)).max(10).optional()
});

export const assignRoleSchema = z.object({
    role: z.string().max(50)
});

