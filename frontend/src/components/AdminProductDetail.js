import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductDetail from './ProductDetail';
import axios from 'axios';

const AdminProductDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    axios.post('/api/logout').then(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    }).catch(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <i className="fas fa-crown text-warning"></i>
            <h3 className="text-gradient mb-0">Admin Panel</h3>
          </div>
          <div className="sidebar-actions">
            <button className="btn btn-sm btn-outline-light" onClick={handleLogout} title="Logout">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${location.pathname === '/admin-dashboard' ? 'active' : ''}`} onClick={() => navigate('/admin-dashboard')}>
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </button>
          <button className={`nav-item ${location.pathname === '/admin-users' ? 'active' : ''}`} onClick={() => navigate('/admin-users')}>
            <i className="fas fa-users"></i>
            <span>Users</span>
          </button>
          <button className={`nav-item ${location.pathname.startsWith('/admin-products') ? 'active' : ''}`} onClick={() => navigate('/admin-products')}>
            <i className="fas fa-box"></i>
            <span>Products</span>
          </button>
          <button className={`nav-item ${location.pathname === '/admin-reports' ? 'active' : ''}`} onClick={() => navigate('/admin-reports')}>
            <i className="fas fa-chart-bar"></i>
            <span>Reports</span>
          </button>
          <button className={`nav-item ${location.pathname === '/admin-profile' ? 'active' : ''}`} onClick={() => navigate('/admin-profile')}>
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </button>
        </nav>
      </div>

      <div className="main-content">
        <ProductDetail />
      </div>
    </div>
  );
};

export default AdminProductDetail;
