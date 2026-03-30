import { z } from 'zod';

export const messageSchema = z.object({
    content: z.string().min(1, "Message content cannot be empty").max(5000, "Message is too long"),
    type: z.enum(['text', 'file', 'gif', 'sticker']).default('text'),
    fileData: z.object({
        name: z.string().max(255, "File name too long"),
        url: z.string().url().max(2048, "URL too long"),
        type: z.string().max(100, "MIME type too long"),
        size: z.number().max(25 * 1024 * 1024, "File too large (25MB max)")
    }).optional()
});
