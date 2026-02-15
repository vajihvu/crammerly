import zxcvbn from 'zxcvbn';

/**
 * Advanced Password Policy Engine
 * Uses entropy-based scoring (zxcvbn) to detect weak but complex-looking passwords.
 */

const COMMON_PATTERNS = [
    'password', 'qwerty', '123456', '7890', 'admin', 'welcome',
    'shabucks', 'crammerly', 'focus', 'study'
];

/**
 * Validate password strength
 * @param {string} password - The plain text password
 * @param {Array} userInputs - Optional: user-specific strings to block (name, email etc)
 * @returns {Object} - { isValid: boolean, score: number, feedback: string, suggestion: string }
 */
export const validatePasswordStrength = (password, userInputs = []) => {
    // 1. Basic length check (already in Zod but good to have here)
    if (!password || password.length < 10) {
        return {
            isValid: false,
            score: 0,
            feedback: 'Password is too short',
            suggestion: 'Minimum 10 characters required.'
        };
    }

    // 2. Block common patterns explicitly
    const lowerPass = password.toLowerCase();
    if (COMMON_PATTERNS.some(pattern => lowerPass.includes(pattern))) {
        return {
            isValid: false,
            score: 0,
            feedback: 'Commonly used pattern detected',
            suggestion: 'Avoid using words like "password", "qwerty", or site names.'
        };
    }

    // 3. zxcvbn entropy check
    const result = zxcvbn(password, userInputs);

    // Score 0: too guessable: risky password. (guesses < 10^3)
    // Score 1: very guessable: protection from throttled online attacks. (guesses < 10^6)
    // Score 2: somewhat guessable: protection from unthrottled online attacks. (guesses < 10^8)
    // Score 3: safely unguessable: moderate protection from offline slow-hash attacks. (guesses < 10^10)
    // Score 4: very safely unguessable: strong protection from offline slow-hash attacks. (guesses >= 10^10)

    // PRODUCTION POLICY: We require at least Score 3 for registration
    const MINIMUM_SCORE = 3;

    if (result.score < MINIMUM_SCORE) {
        return {
            isValid: false,
            score: result.score,
            feedback: result.feedback.warning || 'Password is too weak',
            suggestion: result.feedback.suggestions[0] || 'Use a longer passphrase with mixed character types.'
        };
    }

    return {
        isValid: true,
        score: result.score,
        feedback: 'Strong password',
        suggestion: null
    };
};
