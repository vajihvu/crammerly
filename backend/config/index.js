import { validateEnv } from './validateEnv.js';

const env = validateEnv();

const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    mongoUri: env.MONGO_URI,
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: '15m', // Tightened from 1h to 15m
        refreshExpiresIn: '7d',
        issuer: 'crammerly.io',
        audience: 'crammerly-app'
    },
    features: {
        aiRecommendations: env.FEATURE_AI_RECOMMENDATIONS,
        maintenanceMode: env.FEATURE_MAINTENANCE_MODE
    },
    aiApiKey: env.DEEPSEEK_API_KEY,
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY,
    clientUrl: env.CLIENT_URL,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test'
};

export default config;
export { env };
