export const PESO = '₱';

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * "1234.5" -> "₱1234.50"
 */
export const formatCurrency = (value) => `${PESO}${toNumber(value).toFixed(2)}`;

/**
 * Grouped variant without forced decimals, e.g. "₱1,234.5".
 */
export const formatCurrencyCompact = (value) => `${PESO}${toNumber(value).toLocaleString()}`;

/**
 * Grouped variant with two decimals, e.g. "₱1,234.50".
 */
export const formatCurrencyGrouped = (value) => (
  `${PESO}${toNumber(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
);

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

export const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

export const formatTime = (value) => (value ? new Date(value).toLocaleTimeString() : 'N/A');
