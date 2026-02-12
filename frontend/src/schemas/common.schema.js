import { z } from 'zod';

export const idSchema = z.string().uuid();

export const timestampSchema = z.string().datetime();

export const entitySchema = z.object({
    id: idSchema.optional(),
    created_at: timestampSchema.optional(),
    updated_at: timestampSchema.optional(),
});

export const todoSchema = z.object({
    text: z.string().min(1, "Task cannot be empty").max(200),
    completed: z.boolean().optional(),
});

export const roomSchema = z.object({
    name: z.string().min(3, "Room name must be at least 3 characters").max(50),
    topic: z.string().min(1, "Topic is required"),
    task: z.string().min(1, "Goal is required"),
    privacy: z.enum(['Public', 'Private']).default('Public'),
    code: z.string().length(6).optional(),
    creator_id: idSchema.optional(),
});

export const messageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(1000),
    type: z.enum(['text', 'file', 'image', 'sticker']).default('text'),
    sender_id: idSchema.optional(),
});

export const friendshipSchema = z.object({
    user_id: idSchema,
    friend_id: idSchema,
    status: z.enum(['pending', 'accepted', 'blocked']).default('pending'),
});
