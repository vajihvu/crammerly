import { z } from 'zod';

export const createTodoSchema = z.object({
    text: z.string().min(1, "Task cannot be empty").max(200, "Task is too long"),
    completed: z.boolean().optional().default(false)
});

export const updateTodoSchema = z.object({
    text: z.string().min(1).max(200).optional(),
    completed: z.boolean().optional()
});
