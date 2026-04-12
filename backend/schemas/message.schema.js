import { z } from 'zod';

export const messageSchema = z.object({
    content: z.string().min(1, "Message content cannot be empty").max(10000000, "Message is too large"),
    type: z.enum(['text', 'file', 'image', 'gif', 'sticker', 'voice']).default('text'),
    fileData: z.object({
        name: z.string().max(255, "File name too long"),
        url: z.string().max(5000000, "URL too long").optional(), // Relaxed to support base64 or later assignment
        type: z.string().max(100, "MIME type too long").optional(),
        mimeType: z.string().max(100, "MIME type too long").optional(), // Match frontend key
        size: z.number().max(25 * 1024 * 1024, "File too large (25MB max)").optional()
    }).optional()
});
