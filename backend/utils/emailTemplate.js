import config from '../config/index.js';

/**
 * Branded email template wrapper for Crammerly.
 * Wraps all outgoing emails in a consistent, professional design.
 */
export const emailTemplate = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Crammerly</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Inter',Helvetica,Arial,sans-serif;color:#e2e8f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0"
                    style="background-color:#1e293b;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:28px 32px;text-align:center;">
                            <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">📚 Crammerly</span>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px 32px 24px 32px;color:#e2e8f0;font-size:15px;line-height:1.6;">
                            ${bodyHtml}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:16px 32px 28px 32px;border-top:1px solid #334155;text-align:center;font-size:12px;color:#64748b;">
                            <p style="margin:0 0 8px 0;">
                                <a href="${config.clientUrls?.[0] || 'https://crammerly.app'}/privacy" style="color:#818cf8;text-decoration:none;">Privacy Policy</a>
                                &nbsp;·&nbsp;
                                <a href="${config.clientUrls?.[0] || 'https://crammerly.app'}/terms" style="color:#818cf8;text-decoration:none;">Terms of Service</a>
                            </p>
                            <p style="margin:0;color:#475569;">© ${new Date().getFullYear()} Crammerly. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
