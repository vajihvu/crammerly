import { z } from 'zod';

export const startSessionSchema = z.object({
    roomId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Room ID format").optional(),
});

export const endSessionSchema = z.object({
    taskCompleted: z.string().max(500).optional(),
});
