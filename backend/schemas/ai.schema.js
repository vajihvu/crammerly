import { z } from 'zod';

export const chatSchema = z.object({
    message: z.string().min(1, "Message is required"),
    context: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string()
    })).optional()
});
