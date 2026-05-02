import { z } from 'zod';

export const createRoomSchema = z.object({
    name: z.string().min(3, "Room name must be at least 3 characters").max(50),
    topic: z.string().max(30).optional().default('General'),
    privacy: z.enum(['Public', 'Private']).default('Public'),
    task: z.string().optional(),
    schedule_date: z.string().optional(),
    schedule_time: z.string().optional(),
    roomType: z.enum(['Study', 'Project']).optional().default('Study'),
    description: z.string().max(1000).optional().default(''),
});

export const updateProgressSchema = z.object({
    task: z.string().min(1, "Task description is required"),
});

export const joinRoomSchema = z.object({
    code: z.string().length(6, "Code must be exactly 6 characters").toUpperCase().optional()
});

