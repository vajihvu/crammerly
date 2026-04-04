import config from '../config/index.js';
import { logger } from './logger.js';

if (!config.mail.pass && config.isProduction) {
    logger.warn('⚠️  SMTP_PASS (Resend API Key) is not configured.');
} else if (!config.mail.pass) {
    logger.warn('⚠️  Resend not configured. Emails will be logged to console only (dev mode).');
}

/**
 * Sends an email using the native Resend REST API to bypass Render's Port 587 block
 * and perfectly sidesteps ESM resolution issues for older linters in CI.
 * @param {{ to: string, subject: string, html: string }} mailOptions
 */
export const sendMail = async ({ to, subject, html }) => {
    if (!config.mail.pass || config.isTest || process.env.NODE_ENV === 'test') {
        logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
        return;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.mail.pass}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: config.mail.from || 'Crammerly <noreply@crammerly.app>',
                to,
                subject,
                html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Resend REST API failed');
        }

        logger.info(`Email sent to ${to}: "${subject}" (ID: ${data.id || 'N/A'})`);
    } catch (err) {
        logger.error(`Resend dispatch failed for ${to}: ${err.message}`);
        throw err;
    }
};
