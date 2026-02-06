/**
 * Shared formatting utility functions
 * Used across multiple pages and components
 */

/**
 * Format number with Thai locale and 2 decimal places
 * @param {number} num - Number to format
 * @param {string} locale - Locale string (default: 'th-TH')
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, locale = 'th-TH') => {
    if (num === null || num === undefined) return '0.00';
    return num.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Format number in compact form (K, M)
 * @param {number} num - Number to format
 * @returns {string} Compact formatted string
 */
export const formatCompact = (num) => {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toFixed(0);
};

/**
 * Format date to readable Thai format
 * @param {string} dateString - Date string in ISO format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return '-';
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('th-TH', { ...defaultOptions, ...options });
};

/**
 * Format budget with N/A support
 * @param {number|null} budget - Budget amount
 * @returns {string} Formatted budget or 'N/A'
 */
export const formatBudget = (budget) => {
    if (budget === null || budget === undefined) {
        return 'N/A';
    }
    return `฿${formatNumber(budget)}`;
};

/**
 * Format date to readable Thai format with CE Year
 * Handles date-only strings (YYYY-MM-DD) without timezone shift
 * @param {string} dateString - Date string in ISO format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateCE = (dateString, options = {}) => {
    if (!dateString) return '-';

    // Handle date-only string (YYYY-MM-DD) strict check to avoid timezone shift
    // Only apply manual parsing if strictly 10 chars (e.g., "2026-02-27"), not ISO with time
    let date;
    if (typeof dateString === 'string' && dateString.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Parse as local date to avoid timezone shift for pure date strings
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
    } else {
        // For ISO strings (with T), standard Date parsing works correctly with local timezone
        date = new Date(dateString);
    }

    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        calendar: 'gregory'
    };
    return date.toLocaleDateString('th-TH', { ...defaultOptions, ...options });
};
