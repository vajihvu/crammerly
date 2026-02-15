import { z } from 'zod';

export const todoSchema = z.object({
    text: z.string().min(1, "Task cannot be empty").max(200),
    completed: z.boolean().optional(),
});

export const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

