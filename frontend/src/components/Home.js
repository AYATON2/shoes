import React from 'react';
import { Link } from 'react-router-dom';
import ProductList from './ProductList';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section text-center py-5 text-white position-relative overflow-hidden">
        <div className="hero-bg"></div>
        <div className="container position-relative">
          <h1 className="display-4 font-weight-bold mb-3 animate-fade-in">Welcome to StepUp</h1>
          <p className="lead mb-4 animate-fade-in-delay">Discover amazing products from trusted sellers. Shop with ease and security.</p>
          <div className="mt-4 animate-fade-in-delay-2">
            <Link to="/products" className="btn btn-light btn-lg mr-3 shadow">Browse Products</Link>
            <Link to="/register" className="btn btn-outline-light btn-lg mr-3">Sign Up</Link>
            <Link to="/login" className="btn btn-outline-light btn-lg">Login</Link>
          </div>
        </div>
      </div>
      {/* Products Section */}
      <div className="container mt-5">
        <h2 className="text-center mb-4 text-gradient">Featured Products</h2>
        <ProductList />
      </div>
    </div>
  );
};

export default Home;