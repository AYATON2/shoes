import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

const Home = lazy(() => import('./components/Home'));
const ProductList = lazy(() => import('./components/ProductList'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const CustomerDashboard = lazy(() => import('./components/CustomerDashboard'));
const StaffDashboard = lazy(() => import('./components/StaffDashboard'));
const RiderDashboard = lazy(() => import('./components/RiderDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/AdminUsers'));
const AdminProducts = lazy(() => import('./components/AdminProducts'));
const AdminReports = lazy(() => import('./components/AdminReports'));
const AdminProfile = lazy(() => import('./components/AdminProfile'));
const AdminProductDetail = lazy(() => import('./components/AdminProductDetail'));
const LogisticsManager = lazy(() => import('./components/LogisticsManager'));
const ReviewManager = lazy(() => import('./components/ReviewManager'));
const ReturnManager = lazy(() => import('./components/ReturnManager'));
const ArchiveManager = lazy(() => import('./components/ArchiveManager'));
const Checkout = lazy(() => import('./components/Checkout'));
const Profile = lazy(() => import('./components/Profile'));
const LeaveReview = lazy(() => import('./components/LeaveReview'));

function AppContent() {
  const location = useLocation();
  const showHeader = location.pathname !== '/login' && 
                     location.pathname !== '/register' && 
                     location.pathname !== '/staff-dashboard' &&
                     location.pathname !== '/rider-dashboard' &&
                     !location.pathname.startsWith('/admin');
  return (
    <div className="App">
      {showHeader && <Header />}
      <Suspense fallback={<div className="loading-bar" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/rider-dashboard" element={<RiderDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-users" element={<AdminUsers />} />
          <Route path="/admin-products" element={<AdminProducts />} />
          <Route path="/admin-product/:id" element={<AdminProductDetail />} />
          <Route path="/admin-reports" element={<AdminReports />} />
          <Route path="/admin-profile" element={<AdminProfile />} />
          <Route path="/admin-logistics" element={<LogisticsManager />} />
          <Route path="/admin-reviews" element={<ReviewManager />} />
          <Route path="/admin-returns" element={<ReturnManager />} />
          <Route path="/admin-archive" element={<ArchiveManager />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reviews" element={<LeaveReview />} />

        </Routes>
      </Suspense>
      {showHeader && <Footer />}
      </div>
    );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
