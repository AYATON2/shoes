import { PESO } from './format';

/**
 * The sale the API already filtered down to the currently running ones.
 */
export const getActiveSale = (product) => (
  product && product.sales && product.sales.length > 0 ? product.sales[0] : null
);

/**
 * Price a customer actually pays, mirroring Sale::calculateSalePrice on the backend.
 */
export const getEffectivePrice = (product) => {
  const price = parseFloat(product?.price) || 0;
  const sale = getActiveSale(product);

  if (!sale) return price;
  if (sale.sale_price) return parseFloat(sale.sale_price);
  if (sale.discount_percentage) return price - (price * sale.discount_percentage / 100);
  if (sale.discount_amount) return price - parseFloat(sale.discount_amount);

  return price;
};

export const hasActiveSale = (product) => getActiveSale(product) !== null;

export const getSaleBadgeText = (sale) => (
  sale.discount_percentage
    ? `${sale.discount_percentage}% OFF`
    : `${PESO}${sale.discount_amount} OFF`
);
