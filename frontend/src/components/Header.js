import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/user').then(res => setUser(res.data)).catch(() => localStorage.removeItem('token'));
    }
    // Apply dark mode on load
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const logout = () => {
    axios.post('/api/logout').then(() => {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
  };

  return (
    <>
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <Link className="navbar-brand text-dark font-weight-bold" to="/">StepUp</Link>
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
        <ul className="navbar-nav mr-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/products">Products</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/checkout">Cart ({JSON.parse(localStorage.getItem('cart') || '[]').length})</Link>
          </li>
        </ul>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <button type="button" className="btn btn-outline-dark nav-link mr-2" onClick={(e) => {e.preventDefault(); toggleDarkMode();}}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </li>
          {user ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to={user.role === 'customer' ? '/customer-dashboard' : user.role === 'seller' ? '/seller-dashboard' : '/admin-dashboard'}>Dashboard</Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-link nav-link p-0" onClick={() => setProfilePanelOpen(true)} title="Profile" style={{fontSize: '1.5rem'}}>
                  <i className="fas fa-user-circle"></i>
                </button>
              </li>
              <li className="nav-item">
                <button className="btn btn-outline-dark nav-link" onClick={logout}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
    </nav>
    {/* Profile Panel */}
    {profilePanelOpen && user && (
      <div className="profile-panel-overlay" onClick={() => setProfilePanelOpen(false)} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1050
      }}>
        <div className="profile-panel" onClick={(e) => e.stopPropagation()} style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '300px',
          height: '100%',
          backgroundColor: '#fff',
          boxShadow: '-2px 0 5px rgba(0,0,0,0.5)',
          zIndex: 1051,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div className="profile-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h5 style={{ margin: 0 }}>Menu</h5>
            <button className="close-btn" onClick={() => setProfilePanelOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          </div>
          <div className="profile-panel-body" style={{ flex: 1 }}>
            <button className="panel-item" onClick={() => { navigate('/profile'); setProfilePanelOpen(false); }} style={{ width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', marginBottom: '10px' }}>
              <i className="fas fa-user"></i> Profile
            </button>
            {user.role === 'customer' && (
              <>
                <button className="panel-item" onClick={() => { navigate('/customer-dashboard'); setProfilePanelOpen(false); }} style={{ width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', marginBottom: '10px' }}>
                  <i className="fas fa-history"></i> Order History
                </button>
                <button className="panel-item" onClick={() => { navigate('/checkout'); setProfilePanelOpen(false); }} style={{ width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', marginBottom: '10px' }}>
                  <i className="fas fa-shopping-cart"></i> Cart ({JSON.parse(localStorage.getItem('cart') || '[]').length})
                </button>
              </>
            )}
            <button className="panel-item" onClick={logout} style={{ width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', marginBottom: '10px' }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;