import { z } from 'zod';

export const todoSchema = z.object({
    text: z.string().min(1, "Task cannot be empty").max(200),
    completed: z.boolean().optional(),
});
