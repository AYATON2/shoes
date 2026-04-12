import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const hasActiveSession = () => sessionStorage.getItem('authSession') === '1';

function RequireAuth({ children, allowedRoles = null }) {
  const token = localStorage.getItem('token');
  const user = getStoredUser();
  const role = String(user?.role || '').toLowerCase();

  if (!hasActiveSession() || !token || !user) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authSession');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

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
            <Route
              path="/customer-dashboard"
              element={<RequireAuth allowedRoles={['customer']}><CustomerDashboard /></RequireAuth>}
            />
            <Route
              path="/seller-dashboard"
              element={<RequireAuth allowedRoles={['seller']}><SellerDashboard /></RequireAuth>}
            />
            <Route
              path="/admin-dashboard"
              element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>}
            />
            <Route
              path="/admin-users"
              element={<RequireAuth allowedRoles={['admin']}><AdminUsers /></RequireAuth>}
            />
            <Route
              path="/admin-products"
              element={<RequireAuth allowedRoles={['admin']}><AdminProducts /></RequireAuth>}
            />
            <Route
              path="/admin-product/:id"
              element={<RequireAuth allowedRoles={['admin']}><AdminProductDetail /></RequireAuth>}
            />
            <Route
              path="/admin-reports"
              element={<RequireAuth allowedRoles={['admin']}><AdminReports /></RequireAuth>}
            />
            <Route
              path="/admin-profile"
              element={<RequireAuth allowedRoles={['admin']}><AdminProfile /></RequireAuth>}
            />
            <Route
              path="/checkout"
              element={<RequireAuth><Checkout /></RequireAuth>}
            />
            <Route
              path="/profile"
              element={<RequireAuth><Profile /></RequireAuth>}
            />
            <Route
              path="/order-tracking"
              element={<RequireAuth><OrderTracking /></RequireAuth>}
            />
            <Route
              path="/invoice/:orderId"
              element={<RequireAuth><InvoiceDetail /></RequireAuth>}
            />
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
