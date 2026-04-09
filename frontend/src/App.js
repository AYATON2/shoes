import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';

const Home = lazy(() => import('./components/Home'));
const ProductList = lazy(() => import('./components/ProductList'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const CustomerDashboard = lazy(() => import('./components/CustomerDashboard'));
const SellerDashboard = lazy(() => import('./components/SellerDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/AdminUsers'));
const AdminProducts = lazy(() => import('./components/AdminProducts'));
const AdminReports = lazy(() => import('./components/AdminReports'));
const AdminProfile = lazy(() => import('./components/AdminProfile'));
const AdminProductDetail = lazy(() => import('./components/AdminProductDetail'));
const Checkout = lazy(() => import('./components/Checkout'));
const Profile = lazy(() => import('./components/Profile'));
const OrderTracking = lazy(() => import('./components/OrderTracking'));
const InvoiceDetail = lazy(() => import('./components/InvoiceDetail'));

function AppContent() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const showHeader = location.pathname !== '/' && 
                     location.pathname !== '/customer-dashboard' && 
                     location.pathname !== '/login' && 
                     location.pathname !== '/register' && 
                     location.pathname !== '/seller-dashboard' &&
                     location.pathname !== '/order-tracking' &&
                     !location.pathname.startsWith('/admin') &&
                     !location.pathname.startsWith('/invoice');
  return (
    <div className="App">
      {showHeader && <Header />}
      <main className="app-main">
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>}>
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
            <Route path="/invoice/:orderId" element={<InvoiceDetail />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="ownership-watermark" aria-label="Site ownership watermark">
        <div className="ownership-watermark__inner">
          <span className="ownership-watermark__brand">StepUp Footwear</span>
          <span className="ownership-watermark__dot" aria-hidden="true">•</span>
          <span className="ownership-watermark__text">Official Property</span>
          <span className="ownership-watermark__dot" aria-hidden="true">•</span>
          <span className="ownership-watermark__text">© {currentYear} All Rights Reserved</span>
        </div>
      </footer>
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
