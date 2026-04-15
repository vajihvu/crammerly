import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(__dirname, '..');

// Load env vars from the appropriate file
const initialNodeEnv = process.env.NODE_ENV;
const nodeEnv = initialNodeEnv || 'development';
dotenv.config({ path: path.resolve(rootPath, `.env.${nodeEnv}`) });
// Also load from .env as fallback
dotenv.config({ path: path.resolve(rootPath, '.env') });

// Force preserve initial NODE_ENV if it was set (dotenv shouldn't overwrite, but we ensure it)
if (initialNodeEnv) {
    process.env.NODE_ENV = initialNodeEnv;
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default(nodeEnv),
    PORT: z.string().transform(Number).default('5000'),
    // Support multiple names for the database connection string
    MONGO_URI: z.string().min(1, "MONGO_URI cannot be empty").optional(),
    DATABASE_URL: z.string().min(1, "DATABASE_URL cannot be empty").optional(),
    DB_URL: z.string().min(1, "DB_URL cannot be empty").optional(),

    JWT_SECRET: z.string().min(64, "JWT_SECRET must be at least 64 characters long for production security"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters long").optional(),
    CLIENT_URL: z.string()
        .transform(val => val.split(',').map(url => url.trim()))
        .pipe(z.array(z.string().url("Each CLIENT_URL must be a valid URL"))),
    COOKIE_DOMAIN: z.string().min(1, "COOKIE_DOMAIN is required to prevent cross-site session leakage"),


    // SMTP Credentials (Required for registration & pass recovery)
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
    SMTP_PORT: z.string().transform(Number).default('587'),
    SMTP_USER: z.string().min(1, "SMTP_USER is required"),
    SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
    SMTP_FROM: z.string().email("SMTP_FROM must be a valid email"),

    DEEPSEEK_API_KEY: z.string().optional().describe('API Key for deepseek AI service'),
    GOOGLE_CLIENT_ID: z.string().optional().describe('Google OAuth Client ID'),
    FEATURE_AI_RECOMMENDATIONS: z.string().transform(v => v === 'true').default('true'),
    FEATURE_MAINTENANCE_MODE: z.string().transform(v => v === 'true').default('false'),
    TURNSTILE_SECRET_KEY: z.string().optional().describe('Cloudflare Turnstile secret key for CAPTCHA verification'),
    REDIS_URL: z.string().optional().describe('Redis connection URL for rate limiting'),
    SENTRY_DSN: z.string().url().optional().describe('Sentry DSN for error monitoring'),
}).refine(data => data.MONGO_URI || data.DATABASE_URL || data.DB_URL, {
    message: "One of MONGO_URI, DATABASE_URL, or DB_URL must be provided",
    path: ["MONGO_URI"]
});


export const validateEnv = () => {
    const isTest = process.env.NODE_ENV === 'test';

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        if (isTest) {
            // Return defaults for test mode to allow module loading to proceed
            return envSchema.parse({
                MONGO_URI: 'mongodb://localhost:27017/crammerly_test',
                JWT_SECRET: 'test_secret_placeholder_at_least_64_characters_long_for_validation_safety_',
                JWT_REFRESH_SECRET: 'test_refresh_secret_placeholder_at_least_32_chars',
                CLIENT_URL: 'https://crammerly.app',
                COOKIE_DOMAIN: 'localhost',
                SMTP_HOST: 'localhost',
                SMTP_USER: 'test',
                SMTP_PASS: 'test',
                SMTP_FROM: 'test@crammerly.app'
            });
        }

        console.error('❌ Environment Validation Failed. Missing or invalid variables:');
        const errors = result.error?.issues || result.error?.errors || [];
        if (errors.length > 0) {
            errors.forEach(err => {
                console.error(`   - ${err.path?.join('.') || 'root'}: ${err.message}`);
            });
        } else {
            console.error(result.error);
        }
        process.exit(1);
    }

    return result.data;
};
