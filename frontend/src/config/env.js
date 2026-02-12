/**
 * Centralized environment configuration for the frontend.
 * This ensures clean dev/prod switching without magic strings.
 */

const config = {
    // API URL for backend calls
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',

    // Feature flags
    features: {
        aiRecommendations: import.meta.env.VITE_ENABLE_AI === 'true',
    },

    // Node environment
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV,
    nodeEnv: import.meta.env.MODE,
};

export default config;
