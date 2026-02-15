// helpers.js - Utility functions for Crammerly

/**
 * Format a timestamp to relative time (e.g., "5m ago", "2h ago")
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Formatted relative time
 */
export function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / 60000);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

/**
 * Format a date to readable format (e.g., "Jan 15, 2024")
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date
 */
export function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date to full format with time (e.g., "Jan 15, 2024, 3:45 PM")
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date and time
 */
export function formatDateTime(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get CSS class for user status indicator
 * @param {string} status - User status ('online', 'away', 'busy', 'invisible')
 * @returns {string} - Tailwind CSS class
 */
export function getStatusColor(status) {
  const colors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    invisible: 'bg-slate-500'
  };
  return colors[status] || 'bg-slate-500';
}

/**
 * Get emoji for user status
 * @param {string} status - User status
 * @returns {string} - Status emoji
 */
export function getStatusEmoji(status) {
  const emojis = {
    online: '🟢',
    away: '🟡',
    busy: '🔴',
    invisible: '⚫'
  };
  return emojis[status] || '⚫';
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate a random room code
 * @param {number} length - Code length (default: 6)
 * @returns {string} - Random uppercase code
 */
export function generateRoomCode(length = 6) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Group array items by a key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} - Grouped object
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sort array by date (newest first)
 * @param {Array} array - Array to sort
 * @param {string} dateKey - Key containing the date
 * @returns {Array} - Sorted array
 */
export function sortByDateDesc(array, dateKey = 'createdAt') {
  return [...array].sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]));
}

/**
 * Sort array by date (oldest first)
 * @param {Array} array - Array to sort
 * @param {string} dateKey - Key containing the date
 * @returns {Array} - Sorted array
 */
export function sortByDateAsc(array, dateKey = 'createdAt') {
  return [...array].sort((a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Check if file type is an image
 * @param {string} fileType - MIME type
 * @returns {boolean} - Whether file is an image
 */
export function isImageFile(fileType) {
  return fileType.startsWith('image/');
}

/**
 * Check if file type is a video
 * @param {string} fileType - MIME type
 * @returns {boolean} - Whether file is a video
 */
export function isVideoFile(fileType) {
  return fileType.startsWith('video/');
}

/**
 * Check if file type is a document
 * @param {string} fileType - MIME type
 * @returns {boolean} - Whether file is a document
 */
export function isDocumentFile(fileType) {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  return docTypes.includes(fileType);
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Whether copy was successful
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} - File extension (lowercase)
 */
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Calculate reading time for text
 * @param {string} text - Text content
 * @param {number} wordsPerMinute - Reading speed (default: 200)
 * @returns {number} - Estimated minutes to read
 */
export function calculateReadingTime(text, wordsPerMinute = 200) {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Validate room code format
 * @param {string} code - Room code
 * @returns {boolean} - Whether code is valid format
 */
export function isValidRoomCode(code) {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Get greeting based on time of day
 * @returns {string} - Time-appropriate greeting
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Check if user is online (status)
 * @param {string} status - User status
 * @returns {boolean} - Whether user is online
 */
export function isUserOnline(status) {
  return status === 'online';
}

/**
 * Filter notifications by type
 * @param {Array} notifications - Array of notifications
 * @param {string} type - Notification type to filter
 * @returns {Array} - Filtered notifications
 */
export function filterNotificationsByType(notifications, type) {
  return notifications.filter(n => n.type === type);
}

/**
 * Get unread notifications count
 * @param {Array} notifications - Array of notifications
 * @returns {number} - Count of unread notifications
 */
export function getUnreadCount(notifications) {
  return notifications.filter(n => !n.read).length;
}
