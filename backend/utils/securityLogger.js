import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, '../../logs/agent_security.log');

/**
 * Log sensitive agent activity to a secure file
 * @param {string} type - Action type (e.g., AI_REQUEST, SUSPICIOUS_PROMPT)
 * @param {string} userId - ID of the user performing the action
 * @param {object} metadata - Additional info
 */
export const logAgentActivity = async (type, userId, metadata = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type,
        userId,
        ...metadata
    };

    const logString = JSON.stringify(logEntry) + '\n';

    try {
        // Ensure logs directory exists
        const logDir = path.dirname(LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Append to log (Centralized and immutable by the agent tool itself)
        fs.appendFileSync(LOG_FILE, logString);

        // In production, you would send this to a service like CloudWatch or ELK
        if (type === 'SUSPICIOUS_PROMPT') {
            console.warn(`[SECURITY ALERT] Suspicious prompt detected from user ${userId}`);
        }
    } catch (err) {
        console.error('Failed to write to security log:', err);
    }
};
