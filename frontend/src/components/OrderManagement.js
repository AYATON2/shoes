
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { buildStorageUrl } from '../utils/apiUrl';
import { formatCurrency, formatDate } from '../utils/format';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [assigningRider, setAssigningRider] = useState(null);

  const fetchOrders = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await axios.get('/api/orders');
      setOrders(res.data.data || res.data || []);
      setError(null);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRiders = async () => {
    try {
      const res = await axios.get('/api/riders');
      setRiders(res.data);
    } catch (err) {
      console.error('Fetch riders error:', err);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    fetchRiders();
    const interval = setInterval(() => fetchOrders(false), 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`/api/orders/${orderId}`, { status });
      fetchOrders();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const assignRider = async (orderId, riderId) => {
    setAssigningRider(orderId);
    try {
      await axios.put(`/api/orders/${orderId}`, { rider_id: riderId });
      fetchOrders();
    } catch (err) {
      alert('Failed to assign rider');
    } finally {
      setAssigningRider(null);
    }
  };

  const verifyPayment = async (orderId, action) => {
    try {
      await axios.post(`/api/orders/${orderId}/verify-payment`, { action });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const filteredOrders = orders.filter(o => filterStatus === 'all' || o.status === filterStatus);

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #EEE', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
        <p style={{ color: '#666', fontWeight: '600' }}>Fetching latest orders...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', background: '#FFF', borderRadius: '20px', border: '1px solid #EEE' }}>
        <i className="fas fa-exclamation-circle" style={{ fontSize: '40px', color: '#C62828', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: '800' }}>{error}</h2>
        <button onClick={() => fetchOrders(true)} style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '30px', border: 'none', background: '#111', color: '#FFF', fontWeight: '600', cursor: 'pointer' }}>Retry Now</button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", animation: 'fadeIn 0.3s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .order-row:hover { background: #FAFAFA; }
      `}</style>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>Order Management</h1>
        <p style={{ color: '#666', margin: '8px 0 0' }}>Track, verify, and process customer shipments.</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        {['all', 'received', 'quality_check', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: filterStatus === s ? '#111' : '#F5F5F5', color: filterStatus === s ? '#FFF' : '#666', fontWeight: '600', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
            <span style={{ marginLeft: '8px', opacity: 0.6 }}>{orders.filter(o => s === 'all' || o.status === s).length}</span>
          </button>
        ))}
      </div>

      <div style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #EEE', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EEE' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: '#999', fontWeight: '700' }}>ORDER / DATE</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: '#999', fontWeight: '700' }}>CUSTOMER</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: '#999', fontWeight: '700' }}>STATUS</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: '#999', fontWeight: '700' }}>TOTAL</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', color: '#999', fontWeight: '700' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
               <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#999' }}>No orders found in this category.</td></tr>
            ) : filteredOrders.map(o => (
              <React.Fragment key={o.id}>
                <tr className="order-row" style={{ borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }} onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>#{o.id}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{formatDate(o.created_at)}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{o.user?.name || 'Guest'}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{o.user?.email}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                     <span style={{ 
                       padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                       background: o.status === 'delivered' ? '#E8F5E9' : o.status === 'cancelled' ? '#FFEBEE' : '#FFF3E0',
                       color: o.status === 'delivered' ? '#2E7D32' : o.status === 'cancelled' ? '#C62828' : '#EF6C00'
                     }}>{o.status.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '20px 24px', fontWeight: '700' }}>{formatCurrency(o.total_amount || o.total)}</td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <i className={`fas fa-chevron-${expandedOrder === o.id ? 'up' : 'down'}`} style={{ color: '#CCC' }} />
                  </td>
                </tr>
                {expandedOrder === o.id && (
                  <tr>
                    <td colSpan="5" style={{ padding: '0', background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                       <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', borderLeft: '4px solid #111' }}>
                          <div>
                             <h4 style={{ margin: '0 0 20px', fontSize: '13px', fontWeight: '800', color: '#111', letterSpacing: '1px' }}>ORDER ITEMS & DETAILS</h4>
                             
                             <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                                {(o.orderItems || o.order_items || []).map(item => (
                                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#FFF', borderRadius: '16px', border: '1px solid #E5E5E5', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                     <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', background: '#F5F5F5', borderRadius: '10px', overflow: 'hidden' }}>
                                           <img src={buildStorageUrl(item.sku?.product?.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                           <div style={{ fontSize: '14px', fontWeight: '700', color: '#111', marginBottom: '4px' }}>{item.sku?.product?.name}</div>
                                           <div style={{ fontSize: '12px', color: '#757575', fontWeight: '500' }}>Size: {item.sku?.size} | Color: {item.sku?.color}</div>
                                        </div>
                                     </div>
                                     <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#111' }}>{formatCurrency(item.price)}</div>
                                        <div style={{ fontSize: '12px', color: '#999', fontWeight: '600' }}>Qty: {item.quantity}</div>
                                     </div>
                                  </div>
                                ))}
                             </div>

                             <div style={{ background: '#FFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E5E5' }}>
                                <h5 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#666', letterSpacing: '0.5px' }}>CUSTOMER DETAILS</h5>
                                {(() => {
                                  const addr = o.shipping_address || o.shippingAddress || o.address || {};
                                  const street = addr.street || '—';
                                  const city = addr.city || '—';
                                  const state = addr.state || addr.province || '—';
                                  const phone = addr.phone || o.user?.customer_number || 'N/A';
                                  const name = addr.name || o.user?.name || 'Customer';
                                  
                                  const hasAddress = addr.street || addr.city;

                                  return (
                                    <>
                                      <p style={{ fontSize: '13px', margin: '0 0 4px', color: '#111' }}><strong>Name:</strong> {name}</p>
                                      <p style={{ fontSize: '13px', margin: '0 0 4px', color: '#111' }}><strong>Phone:</strong> {phone}</p>
                                      <p style={{ fontSize: '13px', margin: '0', color: '#111' }}><strong>Address:</strong> {hasAddress ? `${street}, ${city}, ${state}` : 'N/A'}</p>
                                      {o.is_local ? (
                                        <div style={{ marginTop: '16px', borderTop: '1px solid #EEE', paddingTop: '16px' }}>
                                           <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '700', color: '#666' }}>DELIVERY PERSONNEL</p>
                                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                             {o.rider ? (
                                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                 <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                                                   {o.rider.name?.charAt(0).toUpperCase()}
                                                 </div>
                                                 <span style={{ fontSize: '13px', fontWeight: '600' }}>{o.rider.name}</span>
                                               </div>
                                             ) : (
                                               <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No rider assigned</span>
                                             )}
                                             
                                             <select 
                                               value={o.rider_id || ''} 
                                               onChange={(e) => assignRider(o.id, e.target.value)}
                                               disabled={assigningRider === o.id}
                                               style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E5E5E5', fontSize: '12px', width: '100%' }}
                                             >
                                               <option value="">Assign Rider...</option>
                                               {riders.map(r => (
                                                 <option key={r.id} value={r.id}>{r.name} ({r.city})</option>
                                               ))}
                                             </select>
                                           </div>
                                        </div>
                                      ) : (
                                        <div style={{ marginTop: '16px', borderTop: '1px solid #EEE', paddingTop: '16px' }}>
                                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '700', color: '#666' }}>LOGISTICS PROVIDER</p>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111' }}>
                                            <i className="fas fa-truck-fast" style={{ fontSize: '14px', color: '#64748b' }} />
                                            <span style={{ fontSize: '13px', fontWeight: '700' }}>{o.logistics?.name || 'Third-party Logistics'}</span>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                             </div>
                          </div>

                          <div>
                             <h4 style={{ margin: '0 0 20px', fontSize: '13px', fontWeight: '800', color: '#111', letterSpacing: '1px' }}>PROCESS STATUS</h4>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {o.status === 'received' && (
                                  <button onClick={() => updateStatus(o.id, 'quality_check')}
                                    style={{ 
                                      padding: '16px 20px', borderRadius: '14px', border: 'none', 
                                      background: '#10b981', color: '#FFF', 
                                      fontWeight: '800', fontSize: '14px', cursor: 'pointer', 
                                      textAlign: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                                      marginBottom: '10px'
                                    }}>
                                     <i className="fas fa-check-circle" style={{ marginRight: '8px' }} />
                                     ACCEPT ORDER
                                  </button>
                                )}

                                {['quality_check', 'ready_for_pickup', 'shipped', 'delivered'].map(s => {
                                   const isActive = o.status === s;
                                   const isDisabled = o.status === 'received' && s !== 'quality_check';
                                   let label = s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                   if (s === 'shipped' && !o.is_local) label = "Confirm Handover & Ship";

                                   return (
                                     <button key={s} onClick={() => updateStatus(o.id, s)} disabled={isActive || isDisabled} 
                                       style={{ 
                                         padding: '14px 20px', borderRadius: '14px', border: isActive ? '2px solid #111' : '1px solid #E5E5E5', 
                                         background: isActive ? '#111' : '#FFF', color: isActive ? '#FFF' : (isDisabled ? '#CCC' : '#111'), 
                                         fontWeight: '700', fontSize: '13px', cursor: (isActive || isDisabled) ? 'default' : 'pointer', 
                                         textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                         transition: 'all 0.2s',
                                         opacity: isDisabled ? 0.5 : 1
                                       }}>
                                        <span>{label}</span>
                                        {isActive && <i className="fas fa-circle-check" style={{ color: '#16A34A', fontSize: '16px' }} />}
                                     </button>
                                   );
                                })}
                                <button onClick={() => updateStatus(o.id, 'cancelled')} style={{ padding: '14px 20px', borderRadius: '14px', border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textAlign: 'center', marginTop: '16px', transition: 'all 0.2s' }}>
                                  Cancel Order
                                </button>
                             </div>

                             {o.payment_method === 'gcash' && (
                                <div style={{ marginTop: '32px', padding: '24px', background: '#FFF', borderRadius: '16px', border: '1px solid #E5E5E5', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                     <div style={{ width: '28px', height: '28px', background: '#EFF6FF', color: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                       <i className="fas fa-wallet" style={{ fontSize: '12px' }} />
                                     </div>
                                     <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px' }}>GCASH VERIFICATION</h5>
                                   </div>
                                   <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', fontWeight: '500' }}>Ref: <span style={{ color: '#111', fontWeight: '700' }}>{o.payment?.gcash_reference || 'N/A'}</span></p>
                                   
                                   {o.payment?.payment_screenshot && (
                                      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E5E5', marginBottom: '20px', cursor: 'pointer', position: 'relative' }} onClick={() => window.open(buildStorageUrl(o.payment.payment_screenshot))}>
                                        <img src={buildStorageUrl(o.payment.payment_screenshot)} alt="Proof" style={{ width: '100%', display: 'block' }} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                           <span style={{ background: '#FFF', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>View Full Image</span>
                                        </div>
                                      </div>
                                   )}
                                   
                                   {!o.payment?.verified_at ? (
                                      <div style={{ display: 'flex', gap: '12px' }}>
                                         <button onClick={() => verifyPayment(o.id, 'approve')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#16A34A', color: '#FFF', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}>Approve</button>
                                         <button onClick={() => verifyPayment(o.id, 'reject')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#DC2626', color: '#FFF', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}>Reject</button>
                                      </div>
                                   ) : (
                                      <div style={{ padding: '12px', background: '#F0FDF4', color: '#16A34A', borderRadius: '12px', textAlign: 'center', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <i className="fas fa-check-circle" /> VERIFIED
                                      </div>
                                   )}
                                </div>
                             )}
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;
