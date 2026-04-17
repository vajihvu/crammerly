/**
 * Centralized environment configuration for the frontend.
 * This ensures clean dev/prod switching without magic strings.
 */

const config = {
    // API URL for backend calls
    apiUrl: import.meta.env.VITE_API_URL || '/api/v1',

    // Monitoring
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,

    // Feature flags
    features: {
        aiRecommendations: import.meta.env.VITE_ENABLE_AI === 'true',
    },

    // Node environment
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV,
    nodeEnv: import.meta.env.MODE,
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    giphyApiKey: import.meta.env.VITE_GIPHY_API_KEY || 'cw6S767E6c91sVfF50A9499824fF9',
};

export default config;
