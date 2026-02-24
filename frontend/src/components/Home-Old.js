import React from 'react';
import { Link } from 'react-router-dom';
import ProductList from './ProductList';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-content fade-in">
          <h1>Welcome to StepUp</h1>
          <p>Discover amazing products from trusted sellers. Shop with confidence and ease.</p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">Browse Products</Link>
            <Link to="/register" className="btn btn-outline btn-lg">Sign Up</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Login</Link>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        <div className="section-header text-center mb-lg">
          <h2 className="section-title">Featured Products</h2>
          <p className="section-subtitle">Handpicked collection of quality items</p>
        </div>
        <ProductList />
      </div>
    </div>
  );
};

export default Home;