import { z } from 'zod';

export const messageSchema = z.object({
    content: z.string().min(1, "Message content cannot be empty").max(2000, "Message is too long"),
    type: z.enum(['text', 'file', 'system']).default('text'),
    fileData: z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
        size: z.number()
    }).optional()
});
