import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Home from './components/Home';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Login from './components/Login';
import Register from './components/Register';
import CustomerDashboard from './components/CustomerDashboard';
import SellerDashboard from './components/SellerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminProducts from './components/AdminProducts';
import AdminReports from './components/AdminReports';
import AdminProfile from './components/AdminProfile';
import AdminProductDetail from './components/AdminProductDetail';
import Checkout from './components/Checkout';
import Profile from './components/Profile';
import OrderTracking from './components/OrderTracking';

function AppContent() {
  const location = useLocation();
  const showHeader = location.pathname !== '/' && 
                     location.pathname !== '/customer-dashboard' && 
                     location.pathname !== '/login' && 
                     location.pathname !== '/register' && 
                     location.pathname !== '/seller-dashboard' &&
                     location.pathname !== '/order-tracking' &&
                     !location.pathname.startsWith('/admin');
  return (
    <div className="App">
      {showHeader && <Header />}
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-users" element={<AdminUsers />} />
          <Route path="/admin-products" element={<AdminProducts />} />
          <Route path="/admin-product/:id" element={<AdminProductDetail />} />
          <Route path="/admin-reports" element={<AdminReports />} />
          <Route path="/admin-profile" element={<AdminProfile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/order-tracking" element={<OrderTracking />} />
        </Routes>
      </div>
    );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
