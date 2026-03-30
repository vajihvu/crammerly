import { z } from 'zod';

export const chatSchema = z.object({
    message: z.string().min(1, "Message is required").max(4000, "Message too long"),
    context: z.array(z.object({
        role: z.enum(['user', 'assistant']),  // Block 'system' role injection from client
        content: z.string().max(4000, "Context message too long")
    })).max(20, "Too many context messages").optional()
});
