import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductManager = ({ products: passedProducts, onProductsUpdate, onAddProductClick }) => {
  const [products, setProducts] = useState(passedProducts || []);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sales, setSales] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSaleId, setSelectedSaleId] = useState('');

  useEffect(() => {
    // If products are passed as props, use them
    if (passedProducts && passedProducts.length > 0) {
      console.log('ProductManager: Using passed products:', passedProducts);
      setProducts(passedProducts);
    } else if (!passedProducts) {
      // If no props provided, fetch them
      console.log('ProductManager: No products passed as props, fetching...');
      fetchProducts();
    } else {
      // Props provided but empty array
      console.log('ProductManager: Empty products array passed');
      setProducts([]);
    }
    // Fetch available sales
    fetchSales();
  }, [passedProducts]);

  const fetchSales = async () => {
    try {
      const response = await axios.get('/api/sales');
      const allSales = response.data.data || response.data || [];
      // Filter to only active sales without specific products (templates)
      const activeSales = allSales.filter(s => s.is_active && !s.product_id);
      setSales(activeSales);
      console.log('Available sales:', activeSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('ProductManager: Fetching products from API...');
      const response = await axios.get('/api/products?limit=1000');
      const allProducts = response.data.data || [];
      console.log('ProductManager: All products from API:', allProducts);
      
      const userRes = await axios.get('/api/user');
      console.log('ProductManager: Current user ID:', userRes.data.id);
      
      const sellerProducts = allProducts.filter(p => p.seller_id === userRes.data.id);
      console.log('ProductManager: Filtered seller products:', sellerProducts);
      
      setProducts(sellerProducts);
    } catch (error) {
      console.error('ProductManager: Error fetching products:', error);
      showNotification('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      await axios.put(`/api/products/${productId}/stock`, { stock: parseInt(newStock) });
      showNotification('Stock updated successfully!', 'success');
      
      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, stock: parseInt(newStock) } : p
      ));
      
      // Also refresh parent if callback provided
      if (onProductsUpdate) {
        onProductsUpdate();
      } else {
        // Fallback to refetching if no callback
        fetchProducts();
      }
      
      setEditingProduct(null);
      setStockValue('');
    } catch (error) {
      console.error('Error updating stock:', error);
      showNotification('Error updating stock', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenSaleModal = (product) => {
    setSelectedProduct(product);
    setSelectedSaleId('');
    setShowSaleModal(true);
  };

  const handleApplySale = async () => {
    if (!selectedSaleId) {
      showNotification('Please select a sale', 'error');
      return;
    }

    try {
      // Create a new sale entry linked to this specific product
      const sale = sales.find(s => s.id === parseInt(selectedSaleId));
      if (!sale) return;

      const payload = {
        product_id: selectedProduct.id,
        title: sale.title,
        description: sale.description,
        discount_amount: sale.discount_amount,
        discount_percentage: sale.discount_percentage,
        start_date: sale.start_date,
        end_date: sale.end_date
      };

      await axios.post('/api/sales', payload);
      showNotification('Sale applied to product successfully!', 'success');
      
      // Refresh products
      if (onProductsUpdate) {
        onProductsUpdate();
      } else {
        fetchProducts();
      }
      
      setShowSaleModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error applying sale:', error);
      showNotification('Error applying sale to product', 'error');
    }
  };

  const handleRemoveSale = async (productId) => {
    if (!window.confirm('Remove this product from sale?')) return;

    try {
      // Find and delete the product-specific sale
      const response = await axios.get('/api/sales');
      const allSales = response.data.data || response.data || [];
      const productSale = allSales.find(s => s.product_id === productId);
      
      if (productSale) {
        await axios.delete(`/api/sales/${productSale.id}`);
        showNotification('Product removed from sale!', 'success');
        
        if (onProductsUpdate) {
          onProductsUpdate();
        } else {
          fetchProducts();
        }
      }
    } catch (error) {
      console.error('Error removing sale:', error);
      showNotification('Error removing sale', 'error');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '24px' }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          padding: '16px 24px',
          background: notification.type === 'success' ? '#4CAF50' : '#E53935',
          color: '#FFF',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontWeight: '500'
        }}>
          {notification.message}
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#111' }}>
              Manage Products
            </h2>
            <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
              Update stock levels and manage sales for your products
            </p>
          </div>
          {onAddProductClick && (
            <button
              onClick={onAddProductClick}
              style={{
                padding: '12px 24px',
                background: '#FF6B00',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 107, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 0, 0.3)';
              }}
            >
              <i className="fas fa-plus"></i>
              Add New Product
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="🔍 Search products by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '12px 16px',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              fontSize: '15px',
              outline: 'none'
            }}
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #E5E5E5',
              borderTop: '3px solid #111',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#666' }}>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            background: '#FFF',
            padding: '60px 20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid #E5E5E5'
          }}>
            <i className="fas fa-box-open" style={{ fontSize: '48px', color: '#CCC', marginBottom: '16px' }}></i>
            <p style={{ color: '#999', fontSize: '16px' }}>No products found</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                style={{
                  background: '#FFF',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #E5E5E5',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Product Image */}
                <div style={{
                  height: '200px',
                  background: '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {product.image ? (
                    <img
                      src={`http://localhost:8000/storage/${product.image}`}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <i className="fas fa-image" style={{ fontSize: '48px', color: '#CCC' }}></i>
                  )}
                </div>

                {/* Product Details */}
                <div style={{ padding: '16px' }}>
                  <h4 style={{
                    margin: '0 0 4px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {product.name}
                  </h4>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    {product.brand}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#FF6B00'
                    }}>
                      ₱{parseFloat(product.price).toFixed(2)}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: product.stock > 10 ? '#E8F5E9' : product.stock > 0 ? '#FFF3E0' : '#FFEBEE',
                      color: product.stock > 10 ? '#2E7D32' : product.stock > 0 ? '#E65100' : '#C62828'
                    }}>
                      {product.stock || 0} in stock
                    </span>
                  </div>

                  {/* Sale Badge */}
                  {product.sales && product.sales.length > 0 && product.sales.some(s => s.product_id === product.id) && (
                    <div style={{
                      background: '#FFE0B2',
                      border: '1px solid #FF9800',
                      borderRadius: '6px',
                      padding: '8px',
                      marginBottom: '12px',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>🏷️</span>
                        <span style={{ fontWeight: '700', color: '#E65100' }}>ON SALE</span>
                      </div>
                      <div style={{ color: '#666' }}>
                        {product.sales.find(s => s.product_id === product.id)?.title}
                      </div>
                    </div>
                  )}

                  {/* Stock Editor */}
                  {editingProduct === product.id ? (
                    <div>
                      <input
                        type="number"
                        value={stockValue}
                        onChange={(e) => setStockValue(e.target.value)}
                        placeholder="Enter new stock"
                        min="0"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #E5E5E5',
                          borderRadius: '6px',
                          fontSize: '14px',
                          marginBottom: '8px',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateStock(product.id, stockValue)}
                          disabled={!stockValue}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            background: '#4CAF50',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: stockValue ? 'pointer' : 'not-allowed',
                            fontSize: '13px',
                            fontWeight: '600',
                            opacity: stockValue ? 1 : 0.5
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(null);
                            setStockValue('');
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            background: '#F5F5F5',
                            color: '#666',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Action buttons grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingProduct(product.id);
                            setStockValue(product.stock || '0');
                          }}
                          style={{
                            padding: '10px 12px',
                            background: '#111',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          📦 Stock
                        </button>

                        {/* Sale button - check if product has a sale */}
                        {product.sales && product.sales.some(s => s.product_id === product.id) ? (
                          <button
                            onClick={() => handleRemoveSale(product.id)}
                            style={{
                              padding: '10px 12px',
                              background: '#F44336',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            ❌ Remove Sale
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSaleModal(product)}
                            disabled={sales.length === 0}
                            style={{
                              padding: '10px 12px',
                              background: sales.length === 0 ? '#CCC' : '#FF6B00',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: sales.length === 0 ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => sales.length > 0 && (e.currentTarget.style.opacity = '0.8')}
                            onMouseLeave={(e) => sales.length > 0 && (e.currentTarget.style.opacity = '1')}
                          >
                            🏷️ Put on Sale
                          </button>
                        )}
                      </div>
                      {sales.length === 0 && (
                        <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0', textAlign: 'center' }}>
                          Create a sale in Sales & Promotions first
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sale Selection Modal */}
      {showSaleModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
        onClick={() => setShowSaleModal(false)}
        >
          <div style={{
            background: '#FFF',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize:' 20px', fontWeight: '700' }}>
              Put "{selectedProduct.name}" on Sale
            </h3>
            
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Select a sale to apply to this product:
            </p>

            {/* Sales List */}
            <div style={{ marginBottom: '20px' }}>
              {sales.map(sale => (
                <label 
                  key={sale.id}
                  style={{
                    display: 'block',
                    padding: '12px',
                    border: selectedSaleId === sale.id ? '2px solid #FF6B00' : '1px solid #E5E5E5',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    background: selectedSaleId === sale.id ? '#FFF3E0' : '#FFF',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="sale"
                    value={sale.id}
                    checked={selectedSaleId === sale.id}
                    onChange={(e) => setSelectedSaleId(sale.id)}
                    style={{ marginRight: '10px' }}
                  />
                  <strong>{sale.title}</strong>
                  <div style={{ fontSize: '13px', color: '#666', marginLeft: '26px',  marginTop: '4px' }}>
                    {sale.discount_percentage ? `${sale.discount_percentage}% off` : `₱${sale.discount_amount} off`}
                    <br />
                    {new Date(sale.start_date).toLocaleDateString()} - {new Date(sale.end_date).toLocaleDateString()}
                  </div>
                </label>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleApplySale}
                disabled={!selectedSaleId}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: selectedSaleId ? '#FF6B00' : '#CCC',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedSaleId ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Apply Sale
              </button>
              <button
                onClick={() => setShowSaleModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F5F5F5',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProductManager;
