
// Premium Header
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiAssetUrl } from '../utils/apiUrl';

const Header = () => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(!!localStorage.getItem('token'));
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/notifications')
        .then(res => setNotifications(res.data))
        .catch(err => console.error('Error fetching notifications:', err));
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/user')
        .then(res => {
          setUser(res.data);
          setLoadingUser(false);
          fetchNotifications();
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoadingUser(false);
        });
    } else {
      setLoadingUser(false);
    }
    
    const updateCartCount = () => {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(items.length);
      setCartItems(items);
    };
    
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    
    // Polling for notifications every 30s
    const notifInterval = setInterval(fetchNotifications, 30000);
    
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      clearInterval(notifInterval);
    };
  }, [fetchNotifications]);

  const markNotificationsAsRead = () => {
    axios.patch('/api/notifications/read')
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      })
      .catch(console.error);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const logout = () => {
    axios.post('/api/logout').then(() => {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    });
  };

  const goToDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const response = await axios.get('/api/user');
      const freshUser = response.data;
      setUser(freshUser);
      if (freshUser.role === 'customer') navigate('/customer-dashboard');
      else if (freshUser.role === 'staff') navigate('/staff-dashboard');
      else if (freshUser.role === 'admin') navigate('/admin-dashboard');
      else if (freshUser.role === 'rider') navigate('/rider-dashboard');
      else navigate('/customer-dashboard');
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <>
    <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ padding: '16px 24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontSize: '24px', fontWeight: '700', color: '#111', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21c-4.4 0-8-3.6-8-8 0-4.4 8-10 8-10s8 5.6 8 10c0 4.4-3.6 8-8 8z"></path>
            <path d="M12 21v-4"></path>
            <path d="M8 12l2 2 4-4"></path>
          </svg>
          StepUp
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/products" style={{ color: '#111', textDecoration: 'none', fontSize: '15px', fontWeight: '500' }}>Products</Link>
          
          {(user?.role === 'customer' || (loadingUser && localStorage.getItem('token'))) && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setCartOpen(!cartOpen)} style={{ background: 'transparent', border: 'none', color: '#111', fontSize: '20px', cursor: 'pointer', position: 'relative', padding: '8px', display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                {cartCount > 0 && <span style={{ position: 'absolute', top: '2px', right: '0px', background: '#FA5400', color: '#FFF', fontSize: '10px', fontWeight: '700', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF' }}>{cartCount}</span>}
              </button>

              {cartOpen && (
                <>
                  <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 998 }} />
                  <div style={{ position: 'absolute', top: '100%', right: 0, width: '320px', background: '#FFF', border: '1px solid #E5E5E5', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 999, marginTop: '12px', padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Your Cart</h4>
                    {cartItems.length === 0 ? <p style={{ textAlign: 'center', color: '#757575', fontSize: '14px' }}>Your cart is empty.</p> : (
                      <>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                          {cartItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: idx === cartItems.length - 1 ? 'none' : '1px solid #F5F5F5' }}>
                              <img src={item.image ? buildApiAssetUrl(`/storage/${item.image}`) : ''} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{item.name}</p>
                                <p style={{ margin: '4px 0', fontSize: '12px', color: '#757575' }}>Size: {item.size} | Qty: {item.quantity}</p>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>₱{parseFloat(item.price).toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => { navigate('/checkout'); setCartOpen(false); }} style={{ width: '100%', background: '#111', color: '#FFF', border: 'none', padding: '12px', borderRadius: '30px', fontWeight: '600', cursor: 'pointer' }}>Checkout</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {(user?.role === 'customer' || (loadingUser && localStorage.getItem('token'))) && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => { if (!notificationsOpen) markNotificationsAsRead(); setNotificationsOpen(!notificationsOpen); }} style={{ background: 'transparent', border: 'none', color: '#111', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {unreadNotificationsCount > 0 && <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#FA5400', color: '#FFF', fontSize: '9px', fontWeight: '700', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFF' }}>{unreadNotificationsCount}</span>}
              </button>

              {notificationsOpen && (
                <>
                  <div onClick={() => setNotificationsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 998 }} />
                  <div style={{ position: 'absolute', top: '100%', right: '-10px', width: '320px', background: '#FFF', border: '1px solid #E5E5E5', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 999, marginTop: '12px', padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Notifications</h4>
                    {notifications.length === 0 ? <p style={{ textAlign: 'center', color: '#757575', fontSize: '14px' }}>No notifications yet.</p> : (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.map((notif, idx) => (
                          <div key={idx} style={{ padding: '12px', marginBottom: '8px', borderRadius: '8px', background: notif.read ? 'transparent' : 'rgba(250, 84, 0, 0.05)', borderLeft: notif.read ? '2px solid transparent' : '2px solid #FA5400' }}>
                             <p style={{ margin: 0, fontSize: '13px', color: '#111', fontWeight: notif.read ? '500' : '700' }}>{notif.title || 'Notification'}</p>
                             <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>{notif.message}</p>
                             <span style={{ fontSize: '10px', color: '#999', marginTop: '4px', display: 'block' }}>{new Date(notif.created_at).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {!loadingUser && (user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={goToDashboard} style={{ background: '#111', color: '#FFF', border: 'none', padding: '8px 20px', borderRadius: '30px', fontWeight: '600', cursor: 'pointer' }}>Dashboard</button>
              <button onClick={logout} style={{ background: 'transparent', color: '#E11D48', border: '1px solid #E5E5E5', padding: '8px 16px', borderRadius: '30px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>Logout</button>
            </div>
          ) : (
            <Link to="/login" style={{ background: '#111', color: '#FFF', textDecoration: 'none', padding: '8px 20px', borderRadius: '30px', fontWeight: '600' }}>Sign In</Link>
          ))}
        </nav>
      </div>
    </header>
    </>
  );
};

export default Header;
