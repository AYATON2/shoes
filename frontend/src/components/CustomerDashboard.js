import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductList from './ProductList';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    loadUserData();
    loadCart();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (showNotificationsPanel) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [showNotificationsPanel]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadUserData = () => {
    setInitialLoading(true);
    axios.get('/api/user', getAuthConfig())
      .then(res => {
        setUser(res.data);
        setProfileData({ name: res.data.name, email: res.data.email });
        setInitialLoading(false);
      })
      .catch(() => {
        setInitialLoading(false);
        navigate('/login');
      });
  };

  const loadCart = () => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications', getAuthConfig());
      const data = response.data.data || response.data.notifications || response.data || [];
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) {
      return;
    }
    try {
      await axios.put(`/api/notifications/${notificationId}/read`, null, getAuthConfig());
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!notificationId) {
      return;
    }
    try {
      await axios.delete(`/api/notifications/${notificationId}`, getAuthConfig());
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', null, getAuthConfig());
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const toggleNotificationsPanel = () => {
    const nextState = !showNotificationsPanel;
    setShowNotificationsPanel(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const loadOrders = () => {
    setLoadingOrders(true);
    axios.get('/api/orders', getAuthConfig())
      .then(res => {
        setOrders(res.data.data || res.data);
        setLoadingOrders(false);
      })
      .catch(err => {
        console.error('Failed to load orders:', err);
        setLoadingOrders(false);
      });
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setMessage('');
    axios.put('/api/user', profileData, getAuthConfig())
      .then(res => {
        setUser(res.data);
        setEditMode(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch(err => {
        setMessage('Failed to update profile. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    navigate('/login');
  };

  if (initialLoading || !user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#FAFAFA'
      }}>
        <div style={{textAlign: 'center'}}>
          <div className="spinner-border" style={{width: '50px', height: '50px', borderWidth: '3px', color: '#111'}} />
          <p style={{marginTop: '20px', fontSize: '18px', fontWeight: '600', color: '#111'}}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      {/* HEADER / NAVBAR */}
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
            gap: '24px'
          }}>
            <Link to="/products" style={{
              color: '#111',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '500'
            }}>Browse</Link>
            <button
              onClick={toggleNotificationsPanel}
              style={{
                background: 'none',
                border: 'none',
                color: '#111',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              aria-label="Notifications"
              title="Notifications"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/customer-dashboard?tab=settings')}
              style={{
                background: 'none',
                border: 'none',
                color: '#111',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              aria-label="Profile settings"
              title="Profile settings"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="7" r="4" />
                <path d="M4 21a8 8 0 0116 0" />
              </svg>
            </button>
            <Link to="/checkout" style={{
              color: '#111',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <i className="fas fa-shopping-bag"></i> Cart ({cart.length})
            </Link>
            <span style={{
              color: '#757575',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              {user?.name}
            </span>
            <button onClick={handleLogout} style={{
              background: '#111',
              color: '#FFF',
              border: 'none',
              padding: '8px 20px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '15px',
              borderRadius: '30px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {showNotificationsPanel && (
        <div style={{
          position: 'fixed',
          top: '68px',
          right: '20px',
          width: '420px',
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 100px)',
          background: '#FFF',
          border: '1px solid #E5E5E5',
          borderRadius: '8px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E5E5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>
              Notifications
            </h3>
            <button
              onClick={() => setShowNotificationsPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '24px',
                lineHeight: '1',
                padding: 0
              }}
              aria-label="Close notifications"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Actions Bar */}
          <div style={{
            padding: '10px 20px',
            borderBottom: '1px solid #E5E5E5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FAFAFA'
          }}>
            <span style={{ fontSize: '13px', color: '#666' }}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={markAllNotificationsAsRead}
              style={{
                background: 'none',
                color: '#111',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Mark all as read
            </button>
          </div>

          {/* Scrollable List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>No notifications</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={notif.id || idx}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx !== notifications.length - 1 ? '1px solid #F0F0F0' : 'none',
                    background: notif.read ? '#FAFAFA' : '#FFF',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? '#FAFAFA' : '#FFF'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <p style={{
                      margin: 0,
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#111',
                      flex: 1
                    }}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#1976D2',
                        marginLeft: '8px',
                        marginTop: '4px',
                        flexShrink: 0
                      }}></span>
                    )}
                  </div>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    color: '#666',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                  }}>
                    {notif.message}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      style={{
                        background: 'none',
                        color: '#666',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      Mark as read
                    </button>
                    <span style={{ color: '#E0E0E0' }}>•</span>
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      style={{
                        background: 'none',
                        color: '#666',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODERN WELCOME HERO SECTION */}
      <div style={{
        background: '#F5F5F5',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{maxWidth: '900px', margin: '0 auto'}}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            margin: 0,
            marginBottom: '16px',
            color: '#111',
            lineHeight: '1.2'
          }}>Welcome Back, {user?.name}!</h1>
          <p style={{
            fontSize: '18px',
            margin: 0,
            marginBottom: '32px',
            color: '#757575',
            lineHeight: '1.6'
          }}>Discover amazing products from trusted sellers. Shop with confidence and ease.</p>
          
          <div style={{display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link to="/products" style={{
              background: '#111',
              color: '#FFF',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              textDecoration: 'none',
              borderRadius: '30px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <i className="fas fa-shopping-bag"></i> Browse Products
            </Link>
            <Link to="/checkout" style={{
              background: '#FFF',
              color: '#111',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              textDecoration: 'none',
              borderRadius: '30px',
              border: '1px solid #CCCCCC',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#111'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
            >
              <i className="fas fa-shopping-bag"></i> My Cart ({cart.length})
            </Link>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E5E5',
        position: 'sticky',
        top: '68px',
        zIndex: 99
      }}>
        <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex'}}>
          {[
            { id: 'overview', label: 'Overview', icon: 'fas fa-home' },
            { id: 'orders', label: 'Order History', icon: 'fas fa-list' },
            { id: 'settings', label: 'Profile Settings', icon: 'fas fa-cog' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '16px 20px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#111' : '#999',
                borderBottom: activeTab === tab.id ? '2px solid #111' : 'none',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <i className={tab.icon} style={{marginRight: '6px'}}></i>
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => navigate('/order-tracking')}
            style={{
              flex: 1,
              padding: '16px 20px',
              border: 'none',
              background: 'transparent',
              color: '#999',
              borderBottom: 'none',
              fontWeight: '500',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <i className='fas fa-truck' style={{marginRight: '6px'}}></i>
            Track Orders
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{padding: '60px 20px', background: '#FFFFFF'}}>
          <div style={{maxWidth: '1200px', margin: '0 auto'}}>
            <div style={{textAlign: 'center', marginBottom: '48px'}}>
              <h2 style={{
                fontSize: '36px',
                fontWeight: '700',
                color: '#111',
                margin: 0,
                marginBottom: '12px'
              }}>Featured Products</h2>
              <p style={{
                fontSize: '16px',
                color: '#757575',
                margin: 0
              }}>Handpicked collection of quality items from our trusted sellers</p>
            </div>
            <ProductList />
          </div>
        </div>
      )}

      {/* ORDER HISTORY TAB */}
      {activeTab === 'orders' && (
        <div style={{padding: '40px 20px', background: '#FAFAFA', minHeight: 'calc(100vh - 200px)'}}>
          <div style={{maxWidth: '1200px', margin: '0 auto'}}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111',
              margin: '0 0 32px 0'
            }}>Order History</h2>

            {loadingOrders && (
              <div style={{textAlign: 'center', padding: '40px'}}>
                <div className="spinner-border" />
              </div>
            )}

            {!loadingOrders && orders.length === 0 && (
              <div style={{
                background: '#FFFFFF',
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '8px'
              }}>
                <i className="fas fa-shopping-bag" style={{fontSize: '48px', color: '#DDD', marginBottom: '16px'}}></i>
                <h3 style={{color: '#999', margin: '0 0 8px 0'}}>No Orders Yet</h3>
                <p style={{color: '#BBB', margin: 0}}>Start shopping to see your order history here.</p>
                <Link to="/products" style={{
                  display: 'inline-block',
                  marginTop: '20px',
                  background: '#111',
                  color: '#FFF',
                  padding: '12px 24px',
                  borderRadius: '30px',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  Browse Products
                </Link>
              </div>
            )}

            {!loadingOrders && orders.length > 0 && (
              <div style={{display: 'grid', gap: '16px'}}>
                {orders.map(order => (
                  <div key={order.id} style={{
                    background: '#FFFFFF',
                    padding: '24px',
                    borderRadius: '8px',
                    border: '1px solid #E5E5E5'
                  }}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', alignItems: 'center'}}>
                      <div>
                        <p style={{fontSize: '12px', color: '#999', margin: '0 0 4px 0', textTransform: 'uppercase'}}>Order ID</p>
                        <p style={{fontSize: '16px', fontWeight: '600', color: '#111', margin: 0}}>#{order.id}</p>
                      </div>
                      <div>
                        <p style={{fontSize: '12px', color: '#999', margin: '0 0 4px 0', textTransform: 'uppercase'}}>Date</p>
                        <p style={{fontSize: '16px', fontWeight: '500', color: '#111', margin: 0}}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p style={{fontSize: '12px', color: '#999', margin: '0 0 4px 0', textTransform: 'uppercase'}}>Amount</p>
                        <p style={{fontSize: '16px', fontWeight: '600', color: '#111', margin: 0}}>₱{order.total}</p>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '500',
                          background: order.status === 'delivered' ? '#E8F5E9' : order.status === 'shipped' ? '#E3F2FD' : order.status === 'received' ? '#FFF3E0' : '#FFEBEE',
                          color: order.status === 'delivered' ? '#2E7D32' : order.status === 'shipped' ? '#1565C0' : order.status === 'received' ? '#E65100' : '#C62828',
                          textTransform: 'capitalize'
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    {order.order_items && order.order_items.length > 0 && (
                      <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F0F0F0'}}>
                        <p style={{fontSize: '13px', color: '#999', margin: '0 0 12px 0', textTransform: 'uppercase'}}>Items ({order.order_items.length})</p>
                        <div style={{display: 'grid', gap: '8px'}}>
                          {order.order_items.map((item, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              paddingBottom: '8px',
                              borderBottom: idx < order.order_items.length - 1 ? '1px solid #F5F5F5' : 'none',
                              fontSize: '14px'
                            }}>
                              <span style={{color: '#555', flex: 1}}>
                                {item.quantity}x {item.sku?.product?.name || 'Product'}
                              </span>
                              <span style={{color: '#111', fontWeight: '600', marginLeft: '12px'}}>
                                ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div style={{padding: '40px 20px', background: '#FAFAFA', minHeight: 'calc(100vh - 200px)'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111',
              margin: '0 0 32px 0'
            }}>Profile Settings</h2>

            {message && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '24px',
                background: message.includes('successfully') ? '#E8F5E9' : '#FFEBEE',
                color: message.includes('successfully') ? '#2E7D32' : '#C62828',
                fontSize: '14px'
              }}>
                {message}
              </div>
            )}

            <div style={{
              background: '#FFFFFF',
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid #E5E5E5'
            }}>
              {!editMode ? (
                <div>
                  <div style={{marginBottom: '24px'}}>
                    <label style={{display: 'block', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '500'}}>
                      Full Name
                    </label>
                    <p style={{fontSize: '16px', color: '#111', margin: 0, fontWeight: '500'}}>
                      {user?.name}
                    </p>
                  </div>

                  <div style={{marginBottom: '32px'}}>
                    <label style={{display: 'block', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '500'}}>
                      Email Address
                    </label>
                    <p style={{fontSize: '16px', color: '#111', margin: 0, fontWeight: '500'}}>
                      {user?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      background: '#111',
                      color: '#FFF',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '30px',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <i className="fas fa-edit" style={{marginRight: '6px'}}></i>
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate}>
                  <div style={{marginBottom: '24px'}}>
                    <label style={{display: 'block', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '500'}}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #DDD',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#111'}
                      onBlur={(e) => e.target.style.borderColor = '#DDD'}
                    />
                  </div>

                  <div style={{marginBottom: '32px'}}>
                    <label style={{display: 'block', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '500'}}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #DDD',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#111'}
                      onBlur={(e) => e.target.style.borderColor = '#DDD'}
                    />
                  </div>

                  <div style={{display: 'flex', gap: '12px'}}>
                    <button
                      type="submit"
                      style={{
                        background: '#111',
                        color: '#FFF',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '30px',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        flex: 1,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setProfileData({ name: user.name, email: user.email });
                      }}
                      style={{
                        background: '#F5F5F5',
                        color: '#111',
                        border: '1px solid #DDD',
                        padding: '12px 24px',
                        borderRadius: '30px',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        flex: 1,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8E8E8'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div style={{
              background: '#FFFFFF',
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid #E5E5E5',
              marginTop: '24px'
            }}>
              <h3 style={{fontSize: '16px', fontWeight: '600', color: '#111', margin: '0 0 16px 0'}}>
                <i className="fas fa-info-circle" style={{marginRight: '8px', color: '#999'}}></i>
                Account Information
              </h3>
              <div style={{fontSize: '14px', color: '#666', lineHeight: '1.6'}}>
                <p style={{margin: '0 0 12px 0'}}>
                  <strong>Member Since:</strong> {user && new Date(user.created_at).toLocaleDateString()}
                </p>
                <p style={{margin: 0}}>
                  <strong>Role:</strong> <span style={{textTransform: 'capitalize'}}>{user?.role}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
