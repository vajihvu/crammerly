import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: z.string().min(1, "Password is required"),
});


export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: z.string()
        .min(10, "Password must be at least 10 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[a-z]/, "Password must contain a lowercase letter")
        .regex(/[0-9]/, "Password must contain a number")
        .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});


export const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
    password: z.string()
        .min(10, "Security Policy: Password must be at least 10 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[a-z]/, "Password must contain a lowercase letter")
        .regex(/[0-9]/, "Password must contain a number")
        .regex(/[^A-Za-z0-9]/, "Password must contain a special character")
        .optional(),
    avatar: z.string().url("Invalid avatar URL").optional(),
    settings: z.object({
        language: z.string().optional(),
        privacy: z.object({
            allowInvites: z.boolean().optional(),
            showOnlineStatus: z.boolean().optional(),
            allowDMs: z.boolean().optional()
        }).optional()
    }).optional(),
    username: z.string().min(3).max(30).optional(),
    institution: z.string().optional(),
    course: z.string().optional(),
    interests: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional()
});

export const resetPasswordSchema = z.object({
    password: z.string()
        .min(10, "Security Policy: Password must be at least 10 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[a-z]/, "Password must contain a lowercase letter")
        .regex(/[0-9]/, "Password must contain a number")
        .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});



