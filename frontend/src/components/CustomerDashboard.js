import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ProductList from './ProductList';

const CustomerDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadUserData();
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadUserData = () => {
    axios.get('/api/user')
      .then(res => {
        setUser(res.data);
        setProfileData({ name: res.data.name, email: res.data.email });
      })
      .catch(() => navigate('/login'));
  };

  const loadCart = () => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  };

  const loadOrders = () => {
    setLoadingOrders(true);
    axios.get('/api/orders')
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
    axios.put('/api/user', profileData)
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

  if (!user) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" />
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
                        <p style={{fontSize: '13px', color: '#999', margin: '0 0 8px 0', textTransform: 'uppercase'}}>Items ({order.order_items.length})</p>
                        <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                          {order.order_items.map((item, idx) => (
                            <span key={idx} style={{fontSize: '14px', color: '#555'}}>
                              {item.quantity}x {item.sku?.product?.name || 'Product'}
                              {idx < order.order_items.length - 1 && ', '}
                            </span>
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
