import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [user, setUser] = useState(null);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchUnreadNotifications = async () => {
      try {
        const unreadRes = await axios.get('/api/notifications/unread');
        const countFromUnread = unreadRes.data?.count;
        if (typeof countFromUnread === 'number') {
          setUnreadNotifications(Math.max(0, countFromUnread));
          return;
        }

        const listRes = await axios.get('/api/notifications');
        const list = listRes.data?.data || listRes.data?.notifications || listRes.data || [];
        const unreadCount = Array.isArray(list)
          ? list.filter((item) => !item.read).length
          : 0;
        setUnreadNotifications(unreadCount);
      } catch {
        setUnreadNotifications(0);
      }
    };

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/user')
        .then(res => {
          setUser(res.data);
          fetchUnreadNotifications();
        })
        .catch(() => localStorage.removeItem('token'));
    }
    
    // Update cart count
    const updateCartCount = () => {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = Array.isArray(cartItems)
        ? cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        : 0;
      setCartCount(totalItems);
    };
    
    updateCartCount();
    const notificationsInterval = setInterval(() => {
      if (localStorage.getItem('token')) {
        fetchUnreadNotifications();
      }
    }, 10000);

    window.addEventListener('cartUpdated', updateCartCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      clearInterval(notificationsInterval);
    };
  }, []);

  const logout = () => {
    axios.post('/api/logout').then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authSession');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      navigate('/');
    });
  };

  const goToDashboard = async () => {
    try {
      // Fetch fresh user data to ensure we have the correct role
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('/api/user');
      const freshUser = response.data;
      setUser(freshUser); // Update the state with fresh data
      
      // Navigate based on the fresh user role
      if (freshUser.role === 'customer') {
        navigate('/customer-dashboard');
      } else if (freshUser.role === 'seller') {
        navigate('/seller-dashboard');
      } else if (freshUser.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        // Default to customer dashboard if role is unknown
        navigate('/customer-dashboard');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If fetching user fails, clear token and redirect to login
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <>
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E5E5E5',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        padding: '16px 24px',
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to="/" style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#111',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fas fa-shoe-prints"></i>
          StepUp
        </Link>

        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px'
        }}>
          <Link to="/products" style={{
            color: '#111',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '500',
            transition: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#757575'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#111'}
          >
            Products
          </Link>
          
          <Link to="/checkout" style={{
            position: 'relative',
            color: '#111',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span aria-hidden="true" style={{ fontSize: '18px', lineHeight: 1 }}>🛒</span>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-14px',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                borderRadius: '9px',
                background: '#FF3B30',
                color: '#FFF',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                boxShadow: '0 0 0 2px #FFFFFF'
              }}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
          
          {user ? (
            <>
              <button onClick={goToDashboard} style={{
                background: 'transparent',
                color: '#111',
                border: 'none',
                padding: '0',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#757575'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#111'}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/order-tracking?tab=notifications')}
                style={{
                  position: 'relative',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  color: '#111',
                  cursor: 'pointer',
                  padding: '0'
                }}
                aria-label="Notifications"
                title="Notifications"
              >
                <span aria-hidden="true" style={{ fontSize: '18px', lineHeight: 1 }}>🔔</span>
                {unreadNotifications > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 5px',
                    borderRadius: '9px',
                    background: '#FF3B30',
                    color: '#FFF',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    boxShadow: '0 0 0 2px #FFFFFF'
                  }}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>
              <button onClick={() => setProfilePanelOpen(true)} style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                color: '#111',
                cursor: 'pointer',
                padding: '0'
              }}>
                <i className="fas fa-user-circle"></i>
              </button>
              <button onClick={logout} style={{
                background: 'transparent',
                color: '#111',
                border: 'none',
                padding: '8px 16px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '15px',
                borderRadius: '30px',
                transition: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                color: '#111',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '15px'
              }}>
                Sign In
              </Link>
              <Link to="/register" style={{
                background: '#111',
                color: '#FFF',
                textDecoration: 'none',
                padding: '8px 20px',
                fontWeight: '500',
                fontSize: '15px',
                borderRadius: '30px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Join Us
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
    
    {/* Profile Panel */}
    {profilePanelOpen && user && (
      <div onClick={() => setProfilePanelOpen(false)} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1050
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '320px',
          height: '100%',
          backgroundColor: '#FFF',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px', 
            paddingBottom: '16px', 
            borderBottom: '1px solid #E5E5E5' 
          }}>
            <h4 style={{ margin: 0, color: '#111', fontSize: '18px', fontWeight: '600' }}>
              Menu
            </h4>
            <button onClick={() => setProfilePanelOpen(false)} style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer', 
              color: '#111',
              padding: 0
            }}>
              &times;
            </button>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => { navigate('/profile'); setProfilePanelOpen(false); }} style={{ 
              width: '100%', 
              padding: '12px 16px', 
              background: 'transparent', 
              border: 'none', 
              textAlign: 'left', 
              cursor: 'pointer', 
              fontSize: '15px', 
              fontWeight: '500',
              color: '#111',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <i className="fas fa-user" style={{ marginRight: '12px', width: '16px' }}></i>
              Profile
            </button>
            {user.role === 'customer' && (
              <>
                <button onClick={() => { navigate('/customer-dashboard'); setProfilePanelOpen(false); }} style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  background: 'transparent', 
                  border: 'none', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  fontSize: '15px', 
                  fontWeight: '500',
                  color: '#111',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="fas fa-history" style={{ marginRight: '12px', width: '16px' }}></i>
                  Order History
                </button>
                <button onClick={() => { navigate('/checkout'); setProfilePanelOpen(false); }} style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  background: 'transparent', 
                  border: 'none', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  fontSize: '15px', 
                  fontWeight: '500',
                  color: '#111',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="fas fa-shopping-bag" style={{ marginRight: '12px', width: '16px' }}></i>
                  Cart
                </button>
              </>
            )}
            <button onClick={logout} style={{ 
              width: '100%', 
              padding: '12px 16px', 
              background: 'transparent', 
              border: 'none', 
              textAlign: 'left', 
              cursor: 'pointer', 
              fontSize: '15px', 
              fontWeight: '500',
              marginTop: 'auto',
              color: '#111',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <i className="fas fa-sign-out-alt" style={{ marginRight: '12px', width: '16px' }}></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;