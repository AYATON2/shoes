import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';
import { buildStorageUrl } from '../utils/apiUrl';
import { getCart, saveCart } from '../utils/cart';
import { formatCurrencyCompact } from '../utils/format';
import { getEffectivePrice } from '../utils/pricing';

const ProductList = ({ limit }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({ brands: [], types: [], performance_tech: [] });
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Quick View State
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const searchParams = new URLSearchParams(location.search);
    const specialFilter = searchParams.get('filter');
    
    const apiParams = { ...filters };
    if (specialFilter) {
      apiParams.special_filter = specialFilter;
    }
    
    axios.get('/api/products', { params: apiParams })
      .then(res => {
        let list = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
        if (limit) list = list.slice(0, limit);
        setProducts(list);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Failed to fetch products:', err);
        setProducts([]);
        setLoading(false);
      });
  }, [filters, limit, location.search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    axios.get('/api/products/filter-options')
      .then(res => {
        setFilterOptions({
          brands: Array.isArray(res.data?.brands) ? res.data.brands : [],
          types: Array.isArray(res.data?.types) ? res.data.types : [],
          performance_tech: Array.isArray(res.data?.performance_tech) ? res.data.performance_tech : []
        });
      })
      .catch(err => {
        console.error('Failed to fetch filter options:', err);
      });
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

  const handleAddToCart = (product, sku) => {
    if (!sku && product.skus?.length > 0) {
      alert('Please select a size/color');
      return;
    }

    const cart = getCart();
    const skuId = sku ? sku.id : (product.skus && product.skus.length > 0 ? product.skus[0].id : null);
    
    const existingItem = cart.find(i => i.product_id === product.id && i.sku_id === skuId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      setNotification({ message: 'Quantity updated in cart!', type: 'success' });
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        sku_id: skuId,
        sku_details: sku ? `${sku.size} / ${sku.color}` : null,
        quantity: quantity
      });
      setNotification({ message: 'Added to cart!', type: 'success' });
    }
    
    saveCart(cart);
    
    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
    
    setQuickViewProduct(null);
    setQuantity(1);
    setSelectedSku(null);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '0 4%' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.3s ease; }
        .modal-content { background: #FFF; width: 400px; max-height: 90vh; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .sku-btn { border: 1px solid #E5E5E5; padding: 8px 12px; border-radius: 8px; background: #FFF; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
        .sku-btn.active { border-color: #111; background: #111; color: #FFF; }
        @media (max-width: 768px) { .modal-content { width: 90%; } }
      `}</style>

      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      {!limit && (
        <>
          {/* Category Navigation Bar */}
          <div style={{ display: 'flex', gap: '32px', padding: '20px 16px', borderBottom: '1px solid #E5E5E5', marginBottom: '32px', overflowX: 'auto', alignItems: 'center' }}>
            {['All', 'Men', 'Women', 'Kids'].map(category => (
              <button key={category} onClick={() => handleCategoryChange(category)} style={{ background: 'transparent', border: 'none', fontSize: '15px', fontWeight: selectedCategory === category ? '700' : '500', color: selectedCategory === category ? '#111' : '#999', cursor: 'pointer', padding: '0 0 8px 0', borderBottom: selectedCategory === category ? '3px solid #111' : 'none' }}>
                {category}
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '40px', padding: '0 16px', alignItems: 'center' }}>
            <input name="brand" placeholder="SEARCH BRAND" onChange={handleFilterChange} list="brands" style={{ flex: '1', minWidth: '200px', padding: '14px 20px', border: '2px solid #EEE', background: '#F9F9F9', borderRadius: '12px', fontSize: '14px', fontWeight: 600, outline: 'none' }} />
            <datalist id="brands">{(filterOptions?.brands || []).map(brand => <option key={brand} value={brand} />)}</datalist>
            
            <input name="type" placeholder="SHOE TYPE" onChange={handleFilterChange} list="types" style={{ flex: '1', minWidth: '200px', padding: '14px 20px', border: '2px solid #EEE', background: '#F9F9F9', borderRadius: '12px', fontSize: '14px', fontWeight: 600, outline: 'none' }} />
            <datalist id="types">{(filterOptions?.types || []).map(type => <option key={type} value={type} />)}</datalist>

            <button onClick={fetchProducts} style={{ flex: '0 1 auto', whiteSpace: 'nowrap', background: '#111', color: 'white', border: 'none', padding: '14px 28px', fontWeight: '700', fontSize: '14px', borderRadius: '12px', cursor: 'pointer' }}>
              <i className="fas fa-search" style={{ marginRight: '8px' }}></i> Find Shoes
            </button>
          </div>
        </>
      )}

      {/* Grid */}
      {loading && products.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px', padding: '0 24px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton" style={{ height: '320px', borderRadius: '20px' }} />
              <div className="skeleton" style={{ height: '24px', width: '60%' }} />
              <div className="skeleton" style={{ height: '20px', width: '40%' }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><p>No products found</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px', padding: '0 24px', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
          {loading && <div className="loading-bar" />}
          {products.map(product => (
            <div key={product.id} style={{ background: '#FFF', display: 'flex', flexDirection: 'column' }} onMouseEnter={() => setHoveredProduct(product.id)} onMouseLeave={() => setHoveredProduct(null)}>
              {/* Image Container */}
              <div 
                onClick={() => setQuickViewProduct(product)}
                style={{ background: '#F6F6F6', height: '320px', overflow: 'hidden', position: 'relative', cursor: 'pointer', borderRadius: '20px' }}
              >
                 {product.sales?.length > 0 && (
                   <div style={{ position: 'absolute', top: 12, right: 12, background: '#FF4444', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, zIndex: 2 }}>
                     -{Math.round(product.sales[0].discount_percentage || 20)}%
                   </div>
                 )}
                 <img 
                    src={buildStorageUrl(product.image)} alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hoveredProduct === product.id ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.6s' }}
                 />
                 {hoveredProduct === product.id && (
                   <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.1))', display: 'flex', justifyContent: 'center' }}>
                      <span style={{ background: '#FFF', color: '#111', padding: '10px 20px', borderRadius: '30px', fontSize: '13px', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Quick View</span>
                   </div>
                 )}
              </div>

              <div style={{ padding: '20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{product.name}</h4>
                  <span style={{ fontWeight: 800, fontSize: '17px' }}>{formatCurrencyCompact(getEffectivePrice(product))}</span>
                </div>
                <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px 0' }}>{product.brand} • {product.type}</p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                   <Link to={`/product/${product.id}`} style={{ flex: 1, textDecoration: 'none', background: '#F5F5F5', color: '#111', textAlign: 'center', padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '13px' }}>Full Details</Link>
                   <button onClick={(e) => {
                       e.stopPropagation();
                       const availableSku = product.skus?.find(s => s.stock > 0) || product.skus?.[0];
                       handleAddToCart(product, availableSku);
                   }} style={{ flex: 1, background: '#111', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Buy Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

       {/* Quick View Modal */}
       {quickViewProduct && (
         <div className="modal-overlay" onClick={() => setQuickViewProduct(null)}>
           <div className="modal-content" onClick={e => e.stopPropagation()}>
              {/* Top: Image */}
              <div style={{ background: '#f6f6f6', height: '280px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                 <img 
                    src={buildStorageUrl(quickViewProduct.image)} 
                    alt={quickViewProduct.name}
                    style={{ height: '80%', objectFit: 'contain', zIndex: 1 }}
                 />
                 <button 
                    onClick={() => setQuickViewProduct(null)}
                    style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', background: '#FFF', border: '1px solid #EEE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100 }}
                 >
                    <i className="fas fa-times" style={{ color: '#000', fontSize: '16px', fontWeight: '900' }} />
                 </button>
              </div>
 
             {/* Bottom: Info */}
             <div style={{ padding: '24px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                   <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{quickViewProduct.name}</h2>
                   <span style={{ fontSize: '18px', fontWeight: '800', color: '#111' }}>
                      {formatCurrencyCompact(getEffectivePrice(quickViewProduct))}
                   </span>
                </div>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px', textTransform: 'uppercase', fontWeight: 600 }}>{quickViewProduct.brand}</p>
 
                <div style={{ marginBottom: '20px' }}>
                   <h4 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: '#999' }}>SELECT SIZE / COLOR</h4>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {quickViewProduct.skus?.map(sku => (
                        <button 
                          key={sku.id} 
                          className={`sku-btn ${selectedSku?.id === sku.id ? 'active' : ''}`}
                          onClick={() => setSelectedSku(sku)}
                          disabled={sku.stock <= 0}
                          style={{ opacity: sku.stock <= 0 ? 0.4 : 1 }}
                        >
                          {sku.size} / {sku.color}
                        </button>
                      ))}
                   </div>
                </div>

                {selectedSku && (
                    <div style={{ marginBottom: '20px', padding: '12px', background: '#F8F8F8', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '13px', fontWeight: 700, color: '#666' }}>Available Stock:</span>
                       <span style={{ fontSize: '14px', fontWeight: 800, color: selectedSku.stock < 5 ? '#EF4444' : '#111' }}>
                          {selectedSku.stock} pairs left
                       </span>
                    </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '12px', color: '#999' }}>QUANTITY</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EEE', borderRadius: '12px', padding: '4px' }}>
                          <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 700 }}
                          >-</button>
                          <span style={{ width: '40px', textAlign: 'center', fontWeight: 800, fontSize: '16px' }}>{quantity}</span>
                          <button 
                            onClick={() => setQuantity(Math.min(selectedSku ? selectedSku.stock : 99, quantity + 1))}
                            style={{ width: '36px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 700 }}
                          >+</button>
                       </div>
                    </div>
                 </div>
 
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                   <button 
                      onClick={() => handleAddToCart(quickViewProduct, selectedSku)}
                      style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#111', color: '#FFF', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}
                   >
                      Add to Bag
                   </button>
                   <button 
                      onClick={() => navigate(`/product/${quickViewProduct.id}`)}
                      style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '12px', border: '1px solid #E5E5E5', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                   >
                      <i className="fas fa-expand" style={{ color: '#111' }} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
       {/* Notification Toast */}
       {notification && (
         <div style={{
           position: 'fixed',
           bottom: '32px',
           left: '50%',
           transform: 'translateX(-50%)',
           background: '#111',
           color: '#FFF',
           padding: '16px 32px',
           borderRadius: '40px',
           fontSize: '14px',
           fontWeight: '700',
           boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
           zIndex: 2000,
           display: 'flex',
           alignItems: 'center',
           gap: '12px',
           animation: 'slideUp 0.3s ease-out'
         }}>
           <i className="fas fa-check-circle" style={{ color: '#10B981' }} />
           {typeof notification === "object" ? notification?.message : notification}
         </div>
       )}

       <style>{`
         @keyframes slideUp {
           from { transform: translate(-50%, 100%); opacity: 0; }
           to { transform: translate(-50%, 0); opacity: 1; }
         }
       `}</style>
    </div>
  );
};

export default ProductList;
