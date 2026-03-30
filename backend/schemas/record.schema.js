import { z } from 'zod';

export const recordSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long').trim(),
    content: z.string().min(1, 'Content is required').max(50000, 'Content too long').trim(),
    status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
    tags: z.array(z.string().max(50, 'Tag too long').trim()).max(20, 'Too many tags').optional().default([]),
});

export const updateRecordSchema = recordSchema.partial();
