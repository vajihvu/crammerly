import { validateEnv } from './validateEnv.js';

const env = validateEnv();

const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    mongoUri: env.MONGO_URI || env.DATABASE_URL || env.DB_URL,
    jwt: {
        secret: env.JWT_SECRET,

        expiresIn: '15m', // Tightened from 1h to 15m
        refreshExpiresIn: '7d',
        issuer: 'crammerly.io',
        audience: 'crammerly-app',
        cookieDomain: env.COOKIE_DOMAIN
    },
    mail: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        from: env.SMTP_FROM
    },
    sentryDsn: env.SENTRY_DSN,

    features: {
        aiRecommendations: env.FEATURE_AI_RECOMMENDATIONS,
        maintenanceMode: env.FEATURE_MAINTENANCE_MODE
    },
    aiApiKey: env.DEEPSEEK_API_KEY,
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY,
    googleClientId: env.GOOGLE_CLIENT_ID,
    redisUrl: env.REDIS_URL,
    clientUrls: env.CLIENT_URL,
    isProduction: env.NODE_ENV === 'production' || env.NODE_ENV === 'staging',

    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
    isStaging: env.NODE_ENV === 'staging'
};

export default config;
export { env };
