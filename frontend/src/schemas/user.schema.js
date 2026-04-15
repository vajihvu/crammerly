import { z } from 'zod';

export const userProfileSchema = z.object({
    full_name: z.string().min(2, "Name is too short").max(100).optional(),
    username: z.string().min(3, "Username must be at least 3 characters").max(30).optional(),
    bio: z.string().max(500).optional(),
    institution: z.string().max(100).optional(),
    course: z.string().max(100).optional(),
    interests: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    social_links: z.object({
        github: z.string().url().or(z.literal("")).optional(),
        linkedin: z.string().url().or(z.literal("")).optional(),
    }).optional(),
    banner_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    avatarUrl: z.string().url().or(z.literal("")).optional(),
});
