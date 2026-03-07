/**
 * Parse a user-agent string into a friendly device name.
 * Extracted to a shared utility to avoid duplication across auth flows.
 */
export const parseDeviceName = (userAgent = 'Unknown') => {
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Linux')) return 'Linux PC';
    return 'Unknown Device';
};
