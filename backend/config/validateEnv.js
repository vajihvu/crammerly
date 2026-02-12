import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from the appropriate file
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
// Also load from .env as fallback
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('5000'),
    MONGO_URI: z.string().describe('MongoDB connection string'),
    JWT_SECRET: z.string().min(32).describe('Secret key for JWT signing'),
    CLIENT_URL: z.string().url().default('https://crammerly.io'),
    DEEPSEEK_API_KEY: z.string().optional().describe('API Key for deepseek AI service'),
    FEATURE_AI_RECOMMENDATIONS: z.string().transform(v => v === 'true').default('true'),
    FEATURE_MAINTENANCE_MODE: z.string().transform(v => v === 'true').default('false'),
    TURNSTILE_SECRET_KEY: z.string().optional().describe('Cloudflare Turnstile secret key for CAPTCHA verification'),
});

export const validateEnv = () => {
    // In test mode, we often set variables dynamically in setup.js after module imports
    // so we don't want to fail fast here if they are missing at initial module parse.
    const isTest = process.env.NODE_ENV === 'test';

    try {
        const parsed = envSchema.parse(process.env);
        return parsed;
    } catch (error) {
        if (isTest) {
            // Return defaults for test mode to allow module loading to proceed
            return envSchema.parse({
                MONGO_URI: 'mongodb://localhost:27017/test_db',
                JWT_SECRET: 'test_secret_placeholder_32_characters_long',
                CLIENT_URL: 'https://crammerly.io'
            });
        }
        if (error instanceof z.ZodError) {
            const errors = error.errors || [];
            // eslint-disable-next-line no-unused-vars
            const missingVars = errors.map(err => err.path.join('.')).join(', ');
            console.error('❌ Environment Validation Failed. Missing or invalid variables:');
            errors.forEach(err => {
                console.error(`   - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
};
