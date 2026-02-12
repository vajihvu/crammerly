/**
 * Normalizes API errors into a consistent structure for the UI
 * Matches the backend taxonomy defined in ERROR_CODES.md
 */
export const normalizeError = (error) => {
    // 1. Zod Validation Errors (Client-Side)
    if (error.name === 'ZodError') {
        return {
            type: 'VAL_SCHEMA_FAIL',
            message: error.errors[0]?.message || 'Invalid input data',
            details: error.errors
        };
    }

    // 2. Axios / Network Errors
    if (error.isAxiosError) {
        const responseData = error.response?.data;
        const apiError = responseData?.error;

        if (apiError) {
            return {
                type: apiError.code,
                message: apiError.message,
                details: apiError.details,
                status: error.response?.status
            };
        }

        // Network error (No response from server)
        if (error.code === 'ERR_NETWORK') {
            return {
                type: 'SYS_UNAVAILABLE',
                message: ERROR_MESSAGES.NETWORK_ERROR,
                status: 503
            };
        }
    }

    // 3. Generic JS Errors
    return {
        type: 'SYS_INTERNAL',
        message: ERROR_MESSAGES.GENERIC,
        original: error
    };
};

/**
 * Common user-safe error messages (Default Fallback)
 */
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Unable to connect to the server. Please check your internet.',
    GENERIC: 'Something went wrong. Please try again later.'
};
