import nodemailer from 'nodemailer';
import config from '../config/index.js';
import { logger } from './logger.js';

/**
 * Creates and returns a Nodemailer transporter using SMTP credentials from config.
 * Throws at startup if SMTP is not configured in production.
 */
const createTransporter = () => {
    if (!config.mail.host || !config.mail.user || !config.mail.pass) {
        if (config.isProduction) {
            throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
        }
        // In dev, fall back to logging — no crash
        logger.warn('⚠️  SMTP not configured. Emails will be logged to console only (dev mode).');
        return null;
    }

    const transport = nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port || 587,
        secure: (config.mail.port || 587) === 465,
        auth: {
            user: config.mail.user,
            pass: config.mail.pass
        }
    });
    // CRITICAL: Without this listener, SMTP socket errors crash the Node.js process
    transport.on('error', (err) => logger.error(`Nodemailer transport error: ${err.message}`));
    return transport;
};

let transporter;
try {
    transporter = createTransporter();
} catch (err) {
    logger.error(`Mailer init failed: ${err.message}`);
    process.exit(1);
}

/**
 * Sends an email. Falls back to console.info in development if SMTP is not configured.
 * @param {{ to: string, subject: string, html: string }} mailOptions
 */
export const sendMail = async ({ to, subject, html }) => {
    if (!transporter || config.isTest || process.env.NODE_ENV === 'test') {
        // Dev-only fallback
        logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
        return;
    }

    await transporter.sendMail({
        from: config.mail.from || `"Crammerly" <${config.mail.user}>`,
        to,
        subject,
        html
    });

    logger.info(`Email sent to ${to}: "${subject}"`);
};
