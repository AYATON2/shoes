export const CART_STORAGE_KEY = 'cart';
export const CART_UPDATED_EVENT = 'cartUpdated';

export const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

export const notifyCartUpdated = () => {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export const saveCart = (cart) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  notifyCartUpdated();
};

export const clearCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  notifyCartUpdated();
};

export const getCartCount = () => getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);

/**
 * Cart line for a product/SKU pair, priced with any running sale applied.
 */
export const buildCartItem = (product, sku, price, quantity = 1) => ({
  product_id: product.id,
  sku_id: sku.id,
  quantity,
  name: product.name,
  price,
  image: product.image,
  size: sku.size,
  color: sku.color
});
