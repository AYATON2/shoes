import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [user, setUser] = useState(null);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/user').then(res => setUser(res.data)).catch(() => localStorage.removeItem('token'));
    }
    
    // Update cart count
    const updateCartCount = () => {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cartItems.length);
    };
    
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const logout = () => {
    axios.post('/api/logout').then(() => {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    });
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
            color: '#111',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <i className="fas fa-shopping-bag"></i>
            ({cartCount})
          </Link>
          
          {user ? (
            <>
              <Link to={user.role === 'customer' ? '/customer-dashboard' : user.role === 'seller' ? '/seller-dashboard' : '/admin-dashboard'} style={{
                color: '#111',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '500'
              }}>
                Dashboard
              </Link>
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