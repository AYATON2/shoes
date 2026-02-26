import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    axios.get(`/api/products/${id}`).then(res => setProduct(res.data));
  }, [id]);

  // Get unique sizes and colors from SKUs
  const getUniqueSizes = () => {
    if (!product?.skus) return [];
    return [...new Set(product.skus.map(sku => sku.size))].sort();
  };

  const getUniqueColors = () => {
    if (!product?.skus) return [];
    return [...new Set(product.skus.map(sku => sku.color))].filter(c => c);
  };

  const getColorSizes = (color) => {
    if (!product?.skus || !color) return [];
    return product.skus
      .filter(sku => sku.color === color && sku.stock > 0)
      .sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  };

  const getSizeColors = (size) => {
    if (!product?.skus || !size) return [];
    return product.skus
      .filter(sku => sku.size === size && sku.stock > 0)
      .map(sku => sku.color)
      .filter(c => c);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setSelectedSize(null); // Reset size when color changes
    setSelectedSku(null);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (selectedColor) {
      const sku = product.skus.find(s => s.size === size && s.color === selectedColor);
      setSelectedSku(sku || null);
    }
  };

  const addToCart = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedSku) {
      setNotification({ message: 'Please select a size and color', type: 'error' });
      return;
    }
    
    // Calculate the actual price (considering sales)
    let actualPrice = product.price;
    if (product.sales && product.sales.length > 0) {
      const sale = product.sales[0];
      if (sale.sale_price) {
        actualPrice = sale.sale_price;
      } else if (sale.discount_percentage) {
        actualPrice = product.price - (product.price * sale.discount_percentage / 100);
      } else if (sale.discount_amount) {
        actualPrice = product.price - sale.discount_amount;
      }
    }
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.sku_id === selectedSku.id);
    if (existing) {
      existing.quantity += 1;
      setNotification({ message: 'Item quantity updated!', type: 'success' });
    } else {
      cart.push({
        product_id: product.id,
        sku_id: selectedSku.id,
        quantity: 1,
        name: product.name,
        price: actualPrice,
        image: product.image,
        size: selectedSku.size,
        color: selectedSku.color
      });
      setNotification({ message: 'Added to cart!', type: 'success' });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedSku) {
      setNotification({ message: 'Please select a size and color', type: 'error' });
      return;
    }
    
    // Calculate the actual price (considering sales)
    let actualPrice = product.price;
    if (product.sales && product.sales.length > 0) {
      const sale = product.sales[0];
      if (sale.sale_price) {
        actualPrice = sale.sale_price;
      } else if (sale.discount_percentage) {
        actualPrice = product.price - (product.price * sale.discount_percentage / 100);
      } else if (sale.discount_amount) {
        actualPrice = product.price - sale.discount_amount;
      }
    }
    
    // Update cart with new selection
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    
    if (existingIndex !== -1) {
      // Replace existing item with new size/color selection
      cart[existingIndex] = {
        product_id: product.id,
        sku_id: selectedSku.id,
        quantity: cart[existingIndex].quantity, // Keep the same quantity
        name: product.name,
        price: actualPrice,
        image: product.image,
        size: selectedSku.size,
        color: selectedSku.color
      };
      setNotification({ message: 'Cart updated!', type: 'success' });
    } else {
      // Add as new item
      cart.push({
        product_id: product.id,
        sku_id: selectedSku.id,
        quantity: 1,
        name: product.name,
        price: actualPrice,
        image: product.image,
        size: selectedSku.size,
        color: selectedSku.color
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Redirect to checkout
    setTimeout(() => navigate('/checkout'), 500);
  };

  if (!product) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '20px',
      fontWeight: '600'
    }}>
      Loading...
    </div>
  );

  const colors = getUniqueColors();
  const availableSizes = selectedColor ? getColorSizes(selectedColor).map(sku => sku.size) : [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '60px',
        alignItems: 'start'
      }}>
        {/* Product Image */}
        <div style={{
          background: '#f6f6f6',
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Sale Badge */}
          {product.sales && product.sales.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              background: 'linear-gradient(135deg, #FF1744 0%, #D50000 100%)',
              color: '#FFF',
              padding: '10px 20px',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 6px 20px rgba(213, 0, 0, 0.6)',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>🏷️</span>
                <span>ON SALE</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900' }}>
                {product.sales[0].discount_percentage 
                  ? `${product.sales[0].discount_percentage}% OFF` 
                  : `₱${product.sales[0].discount_amount} OFF`}
              </div>
              {product.sales[0].title && (
                <div style={{ fontSize: '10px', fontWeight: '600', opacity: 0.9, marginTop: '2px' }}>
                  {product.sales[0].title}
                </div>
              )}
            </div>
          )}
          
          {/* HOT/TRENDING Badge */}
          {product.is_trending && (
            <div style={{
              position: 'absolute',
              top: product.sales && product.sales.length > 0 ? '140px' : '24px',
              left: '24px',
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF4444 100%)',
              color: '#FFF',
              padding: '8px 18px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 16px rgba(255, 68, 68, 0.5)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '16px' }}>🔥</span>
              TRENDING
            </div>
          )}
          <img
            src={product.image ? `http://localhost:8000/storage/${product.image}` : '/default.jpg'}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Product Details */}
        <div>
          {/* Product Name & Price */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              margin: 0,
              marginBottom: '12px',
              fontSize: '2.5rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              color: '#000000',
              letterSpacing: '0.02em'
            }}>
              {product.name}
            </h1>
            {product.brand && (
              <p style={{
                margin: 0,
                marginBottom: '16px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#999999',
                textTransform: 'uppercase'
              }}>
                {product.brand}
              </p>
            )}
            
            {/* Sale Badge */}
            {product.sales && product.sales.length > 0 && (
              <div style={{
                display: 'inline-block',
                background: '#FF4444',
                color: '#FFF',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '12px',
                textTransform: 'uppercase'
              }}>
                {product.sales[0].discount_percentage 
                  ? `${product.sales[0].discount_percentage}% OFF` 
                  : `₱${product.sales[0].discount_amount} OFF`}
              </div>
            )}
            
            {/* Price Display */}
            <div style={{ marginBottom: '20px' }}>
              {product.sales && product.sales.length > 0 ? (
                <>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#999',
                    textDecoration: 'line-through',
                    marginBottom: '8px'
                  }}>
                    ₱{parseFloat(product.price).toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#FF4444'
                  }}>
                    ₱{product.sales[0].sale_price 
                      ? parseFloat(product.sales[0].sale_price).toFixed(2)
                      : (product.sales[0].discount_percentage
                        ? (product.price - (product.price * product.sales[0].discount_percentage / 100)).toFixed(2)
                        : (product.price - product.sales[0].discount_amount).toFixed(2))}
                  </div>
                </>
              ) : (
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  color: '#FF6B00'
                }}>
                  ₱{parseFloat(product.price).toFixed(2)}
                </div>
              )}
            </div>
            
            {product.description && (
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#666666',
                lineHeight: '1.6'
              }}>
                {product.description}
              </p>
            )}
          </div>

          {/* Color Selection */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{
              margin: 0,
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: '#000000',
              letterSpacing: '0.05em'
            }}>
              Select Colorway
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px'
            }}>
              {colors.length > 0 ? colors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  style={{
                    padding: '14px 16px',
                    minHeight: '60px',
                    background: selectedColor === color ? '#111' : '#f6f6f6',
                    color: selectedColor === color ? '#fff' : '#000',
                    border: selectedColor === color ? '2px solid #111' : '1px solid #ddd',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: '4px',
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    lineHeight: '1.3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedColor !== color) {
                      e.target.style.background = '#e5e5e5';
                      e.target.style.borderColor = '#999';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedColor !== color) {
                      e.target.style.background = '#f6f6f6';
                      e.target.style.borderColor = '#ddd';
                    }
                  }}
                >
                  {color}
                </button>
              )) : (
                <p style={{ gridColumn: '1 / -1', color: '#999', fontSize: '13px', margin: 0 }}>
                  No colorways available
                </p>
              )}
            </div>
          </div>

          {/* Size Selection */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#000000',
                letterSpacing: '0.05em'
              }}>
                Select Size
              </h3>
              <a href="#size-guide" style={{
                fontSize: '13px',
                color: '#111',
                fontWeight: '600',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}>
                Size Guide →
              </a>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {selectedColor && availableSizes.length > 0 ? availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  style={{
                    padding: '16px 12px',
                    background: selectedSize === size ? '#111' : '#f6f6f6',
                    color: selectedSize === size ? '#fff' : '#000',
                    border: selectedSize === size ? '2px solid #111' : '1px solid #ddd',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'none',
                    borderRadius: '4px'
                  }}
                >
                  {size}
                </button>
              )) : colors.length > 0 && !selectedColor ? (
                <p style={{ gridColumn: '1 / -1', color: '#999', fontSize: '13px', margin: 0 }}>
                  Select a colorway first
                </p>
              ) : (
                <p style={{ gridColumn: '1 / -1', color: '#999', fontSize: '13px', margin: 0 }}>
                  No sizes available
                </p>
              )}
            </div>
          </div>

          {/* SKU Stock Info */}
          {selectedSku && (
            <div style={{
              padding: '16px',
              background: '#f6f6f6',
              marginBottom: '40px',
              fontSize: '13px',
              color: selectedSku.stock > 5 ? '#00b000' : selectedSku.stock > 0 ? '#FF6B00' : '#cc0000',
              fontWeight: '700'
            }}>
              {selectedSku.stock > 5 && `In Stock (${selectedSku.stock} available)`}
              {selectedSku.stock > 0 && selectedSku.stock <= 5 && `Only ${selectedSku.stock} left!`}
              {selectedSku.stock === 0 && 'Out of Stock'}
            </div>
          )}

          {/* Add to Cart / Buy Now Button */}
          <button
            onClick={isEditMode ? handleBuyNow : addToCart}
            disabled={!selectedSku}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: selectedSku ? '#111' : '#ccc',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              cursor: selectedSku ? 'pointer' : 'not-allowed',
              transition: 'none',
              borderRadius: '30px',
              letterSpacing: '0.05em'
            }}
          >
            {!selectedSku ? 'Select Options' : isEditMode ? 'Buy Now' : 'Add to Bag'}
          </button>

          {/* Additional Info */}
          {product.performance_tech && (
            <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid #e5e5e5' }}>
              <h3 style={{
                margin: 0,
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#000000',
                letterSpacing: '0.05em'
              }}>
                Technology
              </h3>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#666',
                lineHeight: '1.6'
              }}>
                {product.performance_tech}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;