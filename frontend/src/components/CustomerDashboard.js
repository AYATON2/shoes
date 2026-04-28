// Premium Customer Dashboard - Redesigned Light Version
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import ProductList from './ProductList';
import { buildApiAssetUrl } from '../utils/apiUrl';

const ACCENT = '#FA5400';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  
  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnData, setReturnData] = useState({ order_id: null, reason: '', proof_image: null, preview: null });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'tracking') {
      loadOrders();
    } else if (activeTab === 'returns') {
      loadReturns();
    } else if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [activeTab]);


  const loadUserData = () => {
    setInitialLoading(true);
    api.get('/api/user')
      .then(res => {
        if (res.data.role !== 'customer') {
          navigate(res.data.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard');
          return;
        }
        setUser(res.data);
        setProfileData({ name: res.data.name, email: res.data.email });
        setInitialLoading(false);
      })
      .catch(() => {
        setInitialLoading(false);
        navigate('/login');
      });
  };

  const loadOrders = () => {
    setLoadingOrders(true);
    api.get('/api/orders')
      .then(res => {
        setOrders(res.data.data || res.data);
        setLoadingOrders(false);
      })
      .catch(() => setLoadingOrders(false));
  };

  const loadReturns = () => {
    setLoadingReturns(true);
    api.get('/api/returns')
      .then(res => {
        setReturns(res.data.data || res.data);
        setLoadingReturns(false);
      })
      .catch(() => setLoadingReturns(false));
  };

  const loadNotifications = () => {
    setLoadingNotifications(true);
    api.get('/api/notifications')
      .then(res => {
        setNotifications(res.data.data || res.data);
        setLoadingNotifications(false);
      })
      .catch(() => setLoadingNotifications(false));
  };

  const getStatusLabel = (status) => {
    const labels = {
      'received': 'Order Received',
      'quality_check': 'Quality Check',
      'ready_for_pickup': 'Ready for Pickup',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'returned': 'Returned to Store'
    };
    return labels[status] || status;
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnData.proof_image) return alert('Please upload proof of item condition.');
    setSubmitting(true);

    const fd = new FormData();
    fd.append('order_id', returnData.order_id);
    fd.append('reason', returnData.reason);
    fd.append('proof_image', returnData.proof_image);

    try {
      await api.post('/api/returns', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Return request submitted!');
      setShowReturnModal(false);
      setReturnData({ order_id: null, reason: '', proof_image: null, preview: null });
      loadReturns();
    } catch (err) {
      alert('Failed to submit return.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put('/api/user', profileData);
      setUser(res.data);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const pillStyle = (active) => ({
    padding: '10px 24px',
    borderRadius: '30px',
    border: 'none',
    background: active ? '#111' : '#F5F5F5',
    color: active ? '#FFF' : '#666',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  return (
    <div style={{ background: '#FFF', minHeight: '100vh', color: '#111', fontFamily: "'Inter', sans-serif" }}>
      {/* Subtle Top Progress Bar */}
      {initialLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: '#EEE', zIndex: 9999, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#111', width: '30%', animation: 'loadingBar 1.5s infinite ease-in-out' }} />
        </div>
      )}

      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(400%); width: 30%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .card { background: #FFF; border: 1px solid #E5E5E5; border-radius: 20px; transition: all 0.3s ease; }
        .card:hover { border-color: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .animate-fade { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      {/* Header / Hero */}
      <div style={{ padding: '80px 24px 40px', maxWidth: '1200px', margin: '0 auto', opacity: initialLoading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '800', margin: 0, letterSpacing: '-1.5px' }}>
          Welcome Back, {user?.name ? user.name.split(' ')[0] : '...'}!
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <span style={{ background: '#F5F5F5', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#666' }}>
            CUSTOMER ID: {user?.customer_number || 'N/A'}
          </span>
          <span style={{ color: '#CCC' }}>•</span>
          <span style={{ fontSize: '14px', color: '#666' }}>Premium Member</span>
        </div>

        {/* Navigation Pills */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '48px', overflowX: 'auto', paddingBottom: '10px' }}>
          {[
            { id: 'overview', label: 'Overview', icon: 'fa-house' },
            { id: 'orders', label: 'Order History', icon: 'fa-list-ul' },
            { id: 'tracking', label: 'Track Delivery', icon: 'fa-truck-fast' },
            { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
            { id: 'returns', label: 'My Returns', icon: 'fa-rotate-left' },
            { id: 'settings', label: 'Profile Settings', icon: 'fa-user-gear' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={pillStyle(activeTab === tab.id)}>
              <i className={`fas ${tab.icon}`} style={{ fontSize: '12px' }} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }} className="animate-fade">
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Recommended for You</h2>
                <Link to="/products" style={{ color: '#111', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>View All →</Link>
              </div>
              <ProductList limit={4} />
            </section>
            
            <aside>
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <button onClick={() => navigate('/products')} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#111', color: '#FFF', fontWeight: '600', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fas fa-bag-shopping" /> Browse Products
                  </button>
                  <button onClick={() => navigate('/checkout')} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E5E5E5', background: '#FFF', color: '#111', fontWeight: '600', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fas fa-cart-shopping" /> My Cart
                  </button>
                </div>
              </div>
              
              {orders.length > 0 && (
                <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0' }}>Latest Order</h3>
                  <div style={{ padding: '16px', background: '#FAFAFA', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999' }}>ORDER #{orders[0].id}</p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700' }}>{getStatusLabel(orders[0].status)}</p>
                    <button onClick={() => setActiveTab('tracking')} style={{ border: 'none', background: 'none', padding: 0, color: '#111', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Track Progress →</button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {(activeTab === 'orders' || activeTab === 'tracking') && (
          <div style={{ maxWidth: '800px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px' }}>{activeTab === 'orders' ? 'Your Orders' : 'Delivery Tracking'}</h2>
            {loadingOrders ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <div style={{ padding: '80px 24px', textAlign: 'center', background: '#F9F9F9', borderRadius: '24px' }}>
                <p style={{ color: '#999', marginBottom: '24px' }}>No orders found.</p>
                <button onClick={() => navigate('/products')} style={{ background: '#111', color: '#FFF', padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Start Shopping</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {orders.map(order => (
                  <div key={order.id} className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>#{order.id}</p>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>₱{parseFloat(order.total).toFixed(2)}</h4>
                      </div>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700',
                        background: order.status === 'delivered' ? '#E8F5E9' : '#FFF3E0',
                        color: order.status === 'delivered' ? '#16A34A' : '#D97706'
                      }}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    
                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                      {order.order_items?.map((item, i) => (
                        <div key={i} style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#F5F5F5', overflow: 'hidden', flexShrink: 0 }}>
                           <img src={item.sku?.product?.image ? buildApiAssetUrl(`/storage/${item.sku.product.image}`) : ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                      {activeTab === 'tracking' && (
                         <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E5E5', background: '#FFF', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                            {expandedOrder === order.id ? 'Hide Details' : 'Track Order'}
                         </button>
                      )}
                      {order.status === 'delivered' && (
                        <>
                          <button onClick={() => { setReturnData({ ...returnData, order_id: order.id }); setShowReturnModal(true); }} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E5E5', background: '#FFF', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                            Return Item
                          </button>
                          <button onClick={() => navigate(`/reviews?order=${order.id}`)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#111', color: '#FFF', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                            Leave Review
                          </button>
                        </>
                      )}
                    </div>

                    {expandedOrder === order.id && (
                       <div style={{ marginTop: '20px', padding: '16px', background: '#F9F9F9', borderRadius: '12px' }}>
                          {order.rider && (
                            <div style={{ marginBottom: '16px', padding: '12px', background: '#FFF', borderRadius: '8px', border: '1px solid #EEE' }}>
                               <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Delivery Personnel</p>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                                     {order.rider.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{order.rider.name}</span>
                               </div>
                            </div>
                          )}
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700' }}>Delivery Timeline</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                             {['received', 'ready_for_pickup', 'shipped', 'delivered'].map((s, idx) => {
                                const isDone = ['received', 'ready_for_pickup', 'shipped', 'delivered'].indexOf(s) <= ['received', 'ready_for_pickup', 'shipped', 'delivered'].indexOf(order.status);
                                return (
                                   <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isDone ? 1 : 0.4 }}>
                                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: isDone ? '#111' : '#DDD' }} />
                                      <span style={{ fontSize: '13px', fontWeight: isDone ? '600' : '400' }}>{getStatusLabel(s)}</span>
                                   </div>
                                )
                             })}
                          </div>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px' }}>
             <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px' }}>Profile Settings</h2>
             <div className="card" style={{ padding: '32px' }}>
                <form onSubmit={handleProfileUpdate}>
                   <div style={{ marginBottom: '20px' }}>
                      <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>Full Name</span>
                      <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                   </div>
                   <div style={{ marginBottom: '32px' }}>
                      <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>Email Address</span>
                      <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E5E5' }} />
                   </div>
                   <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#111', color: '#FFF', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                      {submitting ? 'Updating...' : 'Update Profile'}
                   </button>
                </form>
             </div>
          </div>
        )}

        {activeTab === 'returns' && (
          <div style={{ maxWidth: '800px' }}>
             <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px' }}>My Returns</h2>
             {loadingReturns ? (
               <p>Loading returns...</p>
             ) : returns.length === 0 ? (
               <div style={{ padding: '80px 24px', textAlign: 'center', background: '#F9F9F9', borderRadius: '24px' }}>
                 <p style={{ color: '#999', marginBottom: '0' }}>You don't have any return requests.</p>
               </div>
             ) : (
               <div style={{ display: 'grid', gap: '16px' }}>
                 {returns.map(ret => (
                   <div key={ret.id} className="card" style={{ padding: '24px', display: 'flex', gap: '20px' }}>
                     <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: '#F5F5F5', overflow: 'hidden', flexShrink: 0 }}>
                       <img src={ret.proof_image ? buildApiAssetUrl(`/storage/${ret.proof_image}`) : ''} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                     <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                           <div>
                              <p style={{ fontSize: '12px', color: '#999', margin: '0 0 4px 0' }}>ORDER #{ret.order_id}</p>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>Return Request</h4>
                           </div>
                           <span style={{ 
                             padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700',
                             background: ret.status === 'approved' ? '#E8F5E9' : ret.status === 'rejected' ? '#FEE2E2' : '#FFF3E0',
                             color: ret.status === 'approved' ? '#16A34A' : ret.status === 'rejected' ? '#DC2626' : '#D97706'
                           }}>
                             {ret.status.charAt(0).toUpperCase() + ret.status.slice(1).replace('_', ' ')}
                           </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#666', margin: '0', background: '#F9F9F9', padding: '12px', borderRadius: '8px' }}>
                          <strong>Reason:</strong> {ret.reason}
                        </p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
        {activeTab === 'notifications' && (
          <div style={{ maxWidth: '800px' }}>
             <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px' }}>Notifications</h2>
             {loadingNotifications ? (
               <p>Loading notifications...</p>
             ) : notifications.length === 0 ? (
               <div style={{ padding: '80px 24px', textAlign: 'center', background: '#F9F9F9', borderRadius: '24px' }}>
                 <p style={{ color: '#999', marginBottom: '0' }}>No notifications yet.</p>
               </div>
             ) : (
               <div style={{ display: 'grid', gap: '16px' }}>
                 {notifications.map(notif => (
                   <div key={notif.id} className="card" style={{ padding: '24px', borderLeft: notif.read ? 'none' : `4px solid ${ACCENT}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                         <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>{notif.title}</h4>
                         <span style={{ fontSize: '11px', color: '#999' }}>{new Date(notif.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#444', margin: 0, whiteSpace: 'pre-wrap' }}>{notif.message}</p>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </main>

      {/* Return Modal */}
      {showReturnModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="animate-fade" style={{ background: '#FFF', padding: '32px', borderRadius: '24px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 12px 0' }}>Request a Return</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Please provide the reason for your return and upload a photo of the product condition.</p>
            
            <form onSubmit={handleReturnSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Reason for Return</span>
                <textarea value={returnData.reason} onChange={e => setReturnData({...returnData, reason: e.target.value})} placeholder="Why are you returning this item?" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5E5', minHeight: '100px', fontFamily: 'inherit' }} />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Proof of Condition (Image)</span>
                <div 
                  onClick={() => document.getElementById('return-image').click()}
                  style={{ width: '100%', height: '150px', border: '2px dashed #E5E5E5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
                >
                  {returnData.preview ? (
                    <img src={returnData.preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#999' }}>
                      <i className="fas fa-camera" style={{ fontSize: '24px', marginBottom: '8px' }} /><br />
                      <span style={{ fontSize: '12px' }}>Click to upload photo</span>
                    </div>
                  )}
                </div>
                <input 
                  id="return-image" type="file" accept="image/*" hidden 
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) setReturnData({...returnData, proof_image: file, preview: URL.createObjectURL(file)});
                  }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowReturnModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E5E5E5', background: '#FFF', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#111', color: '#FFF', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {message && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#FFF', padding: '12px 24px', borderRadius: '30px', fontWeight: '600', fontSize: '14px', zIndex: 3000, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
