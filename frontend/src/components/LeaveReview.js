
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiAssetUrl } from '../utils/apiUrl';

const LeaveReview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/customer-dashboard');
      return;
    }
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get(`/api/orders/${orderId}`);
      setOrder(res.data);
      // Select first product by default if exists
      if (res.data.order_items && res.data.order_items.length > 0) {
        setSelectedProduct(res.data.order_items[0].sku.product);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      navigate('/customer-dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setSubmitting(true);
    try {
      await axios.post('/api/reviews', {
        product_id: selectedProduct.id,
        rating,
        comment
      });
      alert('Thank you for your review!');
      navigate('/customer-dashboard?tab=orders');
    } catch (err) {
      alert('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #EEE', borderTopColor: '#FA5400', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px', fontFamily: 'Outfit, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .product-select { border: 2px solid #F1F5F9; transition: all 0.2s; cursor: pointer; }
        .product-select.active { border-color: #FA5400; background: #FFF7F3; }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '48px', animation: 'fadeIn 0.5s ease' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 12px 0', letterSpacing: '-1.5px' }}>Share Your Experience</h1>
        <p style={{ color: '#64748B', fontSize: '18px' }}>Your feedback helps us improve and helps other shoppers make better choices.</p>
      </div>

      <div style={{ background: '#FFF', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', animation: 'fadeIn 0.7s ease' }}>
        <form onSubmit={handleSubmit}>
          {/* Product Selection */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '1px' }}>Which item are you reviewing?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {order.order_items?.map((item, i) => {
                const p = item.sku.product;
                const isActive = selectedProduct?.id === p.id;
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedProduct(p)}
                    className={`product-select ${isActive ? 'active' : ''}`}
                    style={{ padding: '16px', borderRadius: '20px', textAlign: 'center' }}
                  >
                    <div style={{ width: '80px', height: '80px', margin: '0 auto 12px', borderRadius: '12px', background: '#F8FAFC', overflow: 'hidden' }}>
                      <img src={p.image ? buildApiAssetUrl(`/storage/${p.image}`) : ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: isActive ? '#FA5400' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '20px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '1px' }}>How would you rate it?</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', transition: 'transform 0.1s' }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i 
                    className={`${(hoverRating || rating) >= star ? 'fas' : 'far'} fa-star`} 
                    style={{ fontSize: '36px', color: (hoverRating || rating) >= star ? '#FFD700' : '#E2E8F0' }} 
                  />
                </button>
              ))}
            </div>
            <div style={{ marginTop: '16px', fontSize: '16px', fontWeight: '700', color: '#64748B' }}>
              {['Poor', 'Fair', 'Good', 'Very Good', 'Amazing'][rating - 1]}
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', marginBottom: '12px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '1px' }}>What did you like or dislike?</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us about the fit, comfort, and quality..."
              required
              style={{ width: '100%', minHeight: '150px', padding: '20px', borderRadius: '20px', border: '2px solid #F1F5F9', fontSize: '16px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#FA5400'}
              onBlur={e => e.target.style.borderColor = '#F1F5F9'}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              type="button" 
              onClick={() => navigate('/customer-dashboard')}
              style={{ flex: 1, padding: '18px', borderRadius: '40px', border: '2px solid #F1F5F9', background: '#FFF', color: '#64748B', fontWeight: '700', cursor: 'pointer', fontSize: '16px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ flex: 2, padding: '18px', borderRadius: '40px', border: 'none', background: '#111', color: '#FFF', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
            >
              {submitting ? 'Submitting Review...' : 'Post My Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveReview;
