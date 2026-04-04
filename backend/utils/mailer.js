import { Resend } from 'resend';
import config from '../config/index.js';
import { logger } from './logger.js';

let resendClient = null;

if (!config.mail.pass && config.isProduction) {
    logger.warn('⚠️  SMTP_PASS (Resend API Key) is not configured.');
} else if (config.mail.pass) {
    resendClient = new Resend(config.mail.pass);
} else {
    logger.warn('⚠️  Resend not configured. Emails will be logged to console only (dev mode).');
}

/**
 * Sends an email using the Resend REST API to bypass Render's Port 587 block.
 * Falls back to console.info in development if not configured.
 * @param {{ to: string, subject: string, html: string }} mailOptions
 */
export const sendMail = async ({ to, subject, html }) => {
    if (!resendClient || config.isTest || process.env.NODE_ENV === 'test') {
        // Dev-only fallback
        logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
        return;
    }

    try {
        const { data, error } = await resendClient.emails.send({
            from: config.mail.from || 'Crammerly <noreply@crammerly.app>',
            to,
            subject,
            html
        });

        if (error) {
            throw new Error(error.message);
        }

        logger.info(`Email sent to ${to}: "${subject}" (ID: ${data?.id})`);
    } catch (err) {
        logger.error(`Resend dispatch failed for ${to}: ${err.message}`);
        throw err;
    }
};
