import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ProductList from './ProductList';

const CustomerDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadUserData();
    loadCart();
  }, [navigate]);

  const loadUserData = () => {
    axios.get('/api/user')
      .then(res => setUser(res.data))
      .catch(() => navigate('/login'));
  };

  const loadCart = () => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
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
    <div>
      {/* HEADER / NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
        <Link className="navbar-brand font-weight-bold mr-4" to="/">
          StepUp
        </Link>

        {/* LEFT SIDE ITEMS */}
        <div className="d-flex align-items-center">
          <Link to="/cart" className="btn btn-outline-light mr-3">
            🛒 Cart ({cart.length})
          </Link>

          {/* Settings Dropdown */}
          <div className="dropdown mr-3">
            <button
              className="btn btn-outline-light dropdown-toggle"
              type="button"
              data-toggle="dropdown"
            >
              ⚙️ {user.name || 'Account'}
            </button>

            <div className="dropdown-menu">
              <Link className="dropdown-item" to="/orders">
                📦 Order History
              </Link>
              <Link className="dropdown-item" to="/profile">
                👤 Profile Management
              </Link>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-danger"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="hero-section text-center py-5 text-white">
        <div className="container">
          <h1 className="display-4 font-weight-bold mb-3">
            Welcome to StepUp
          </h1>
          <p className="lead mb-4">
            Discover amazing products from trusted sellers.
          </p>

          <div className="mt-4">
            <Link to="/products" className="btn btn-light btn-lg mr-3">
              Browse Products
            </Link>
            <Link to="/cart" className="btn btn-outline-light btn-lg">
              View Cart ({cart.length})
            </Link>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="container mt-5">
        <h2 className="text-center mb-4">
          Featured Products
        </h2>
        <ProductList />
      </div>
    </div>
  );
};

export default CustomerDashboard;
