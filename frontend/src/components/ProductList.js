import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({ brands: [], types: [], performance_tech: [] });
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchProducts = useCallback(() => {
    axios.get('/api/products', { params: filters })
      .then(res => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setProducts(list);
      })
      .catch(err => {
        console.warn('Failed to fetch products:', err && err.message ? err.message : err);
        setProducts([]);
      });
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    axios.get('/api/products/filter-options').then(res => setFilterOptions(res.data));
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === 'All') {
      setFilters({ ...filters, gender: '' });
    } else {
      setFilters({ ...filters, gender: category });
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Category Navigation Bar - Nike Style */}
      <div style={{
        display: 'flex',
        gap: '32px',
        padding: '20px 16px',
        borderBottom: '1px solid #E5E5E5',
        marginBottom: '32px',
        overflowX: 'auto',
        alignItems: 'center'
      }}>
        {['All', 'Men', 'Women', 'Kids'].map(category => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '15px',
              fontWeight: selectedCategory === category ? '700' : '500',
              color: selectedCategory === category ? '#111' : '#999',
              cursor: 'pointer',
              padding: 0,
              whiteSpace: 'nowrap',
              borderBottom: selectedCategory === category ? '3px solid #111' : 'none',
              paddingBottom: selectedCategory === category ? '8px' : '8px',
              transition: 'none'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Nike-Style Filter Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-2xl)',
        padding: '0 var(--spacing-lg)'
      }}>
        <input 
          name="brand" 
          placeholder="SEARCH BRAND" 
          onChange={handleFilterChange} 
          list="brands"
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            border: '2px solid #000000',
            background: '#f6f6f6',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            textTransform: 'uppercase',
            outline: 'none',
            transition: 'none'
          }}
        />
        <datalist id="brands">
          {filterOptions.brands.map(brand => <option key={brand} value={brand} />)}
        </datalist>

        <input 
          name="type" 
          placeholder="SHOE TYPE" 
          onChange={handleFilterChange} 
          list="types"
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            border: '2px solid #000000',
            background: '#f6f6f6',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            textTransform: 'uppercase',
            outline: 'none',
            transition: 'none'
          }}
        />
        <datalist id="types">
          {filterOptions.types.map(type => <option key={type} value={type} />)}
        </datalist>

        <input 
          name="performance_tech" 
          placeholder="TECH" 
          onChange={handleFilterChange} 
          list="performance_tech"
          style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            border: '2px solid #000000',
            background: '#f6f6f6',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            textTransform: 'uppercase',
            outline: 'none',
            transition: 'none'
          }}
        />
        <datalist id="performance_tech">
          {filterOptions.performance_tech.map(tech => <option key={tech} value={tech} />)}
        </datalist>

        <button 
          onClick={fetchProducts}
          style={{
            background: '#000000',
            color: 'white',
            border: 'none',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            fontWeight: 900,
            fontSize: 'var(--font-size-sm)',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#FF6B00'}
          onMouseLeave={(e) => e.target.style.background = '#000000'}
        >
          <i className="fas fa-search"></i> Filter
        </button>
      </div>

      {/* STAGGERED GRID - Nike Style */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--spacing-lg)',
        padding: '0 var(--spacing-lg)',
        autoRows: '1fr'
      }}>
        {products.map((product, index) => (
          <div
            key={product.id}
            style={{
              gridColumn: 'span 1',
              gridRow: 'span 1',
              background: '#ffffff',
              border: 'none',
              overflow: 'hidden',
              transition: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={() => setHoveredProduct(product.id)}
            onMouseLeave={() => setHoveredProduct(null)}
          >
            {/* Product Image with Zoom Effect */}
            <div style={{
              background: '#f6f6f6',
              overflow: 'hidden',
              height: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {product.image ? (
                <img 
                  src={`http://localhost:8000/storage/${product.image}`}
                  alt={product.name}
                  onError={(e) => {
                    console.error(`Failed to load image: http://localhost:8000/storage/${product.image}`);
                    e.target.src = '/default.jpg';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: hoveredProduct === product.id ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.15s ease'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f6f6f6',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  No Image
                </div>
              )}
            </div>

            {/* Product Info */}
            <div style={{
              padding: 'var(--spacing-lg)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h4 style={{
                  margin: 0,
                  marginBottom: 'var(--spacing-sm)',
                  fontSize: '1.125rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#000000',
                  letterSpacing: '0.02em'
                }}>
                  {product.name}
                </h4>
                {product.gender && (
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: '#111',
                    color: '#FFF',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                  }}>
                    {product.gender}
                  </div>
                )}
                <p style={{
                  margin: 0,
                  marginBottom: 'var(--spacing-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: '#666666',
                  lineHeight: 1.5
                }}>
                  {product.description ? product.description.substring(0, 80) + '...' : 'Premium Quality'}
                </p>
              </div>

              {/* Price & Hidden UI */}
              <div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: '#FF6B00',
                  marginBottom: 'var(--spacing-md)',
                  textTransform: 'uppercase'
                }}>
                  ${product.price}
                </div>

                {/* Buttons appear on hover */}
                {hoveredProduct === product.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    <Link 
                      to={`/product/${product.id}`} 
                      style={{
                        background: '#000000',
                        color: 'white',
                        padding: 'var(--spacing-md)',
                        textDecoration: 'none',
                        fontWeight: 900,
                        fontSize: 'var(--font-size-sm)',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        transition: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#FF6B00'}
                      onMouseLeave={(e) => e.target.style.background = '#000000'}
                    >
                      <i className="fas fa-eye"></i> View
                    </Link>
                    <button
                      onClick={() => {
                        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        const existingItem = cart.find(i => i.product_id === product.id);
                        
                        if (existingItem) {
                          existingItem.quantity += 1;
                          setNotification({ message: 'Item quantity updated!', type: 'success' });
                        } else {
                          cart.push({
                            product_id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image,
                            sku_id: product.skus && product.skus.length > 0 ? product.skus[0].id : null,
                            quantity: 1
                          });
                          setNotification({ message: 'Added to cart!', type: 'success' });
                        }
                        localStorage.setItem('cart', JSON.stringify(cart));
                        window.dispatchEvent(new Event('cartUpdated'));
                      }}
                      style={{
                        background: '#FF6B00',
                        color: 'white',
                        padding: 'var(--spacing-md)',
                        fontWeight: 900,
                        fontSize: 'var(--font-size-sm)',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#000000'}
                      onMouseLeave={(e) => e.target.style.background = '#FF6B00'}
                    >
                      <i className="fas fa-shopping-bag"></i> Add
                    </button>
                  </div>
                ) : (
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#999999',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}>
                    Hover for details
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Products State */}
      {products.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-2xl)',
          color: '#666666'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-lg)', opacity: 0.5 }}>
            <i className="fas fa-shoe-prints"></i>
          </div>
          <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, textTransform: 'uppercase' }}>
            No Shoes Found
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#999999' }}>
            Try adjusting your filters or check back soon for new drops
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductList;