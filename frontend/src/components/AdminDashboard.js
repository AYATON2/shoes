import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import AdminProducts from './AdminProducts';
import AdminReports from './AdminReports';
import AdminProfile from './AdminProfile';
import AdminAnalytics from './AdminAnalytics';
import LogisticsManager from './LogisticsManager';
import RiderManager from './RiderManager';
import ReviewManager from './ReviewManager';
import ReturnManager from './ReturnManager';
import ArchiveManager from './ArchiveManager';
import SalesManager from './SalesManager';
import OrderManagement from './OrderManagement';
import api from '../utils/api';

const SIDEBAR_BG = '#0A0A0A';
const ACCENT = '#FA5400';

const navItems = [
  { key: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
  { key: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
  { key: 'orders', icon: 'fa-shopping-cart', label: 'Orders' },
  { key: 'users', icon: 'fa-users', label: 'Users & Staff' },
  { key: 'products', icon: 'fa-box-open', label: 'Products' },
  { key: 'promotions', icon: 'fa-tag', label: 'Promotions' },
  { key: 'logistics', icon: 'fa-truck', label: 'Logistics' },
  { key: 'riders', icon: 'fa-motorcycle', label: 'Riders' },
  { key: 'reports', icon: 'fa-chart-bar', label: 'Reports' },
  { key: 'reviews', icon: 'fa-star', label: 'Reviews' },
  { key: 'returns', icon: 'fa-rotate-left', label: 'Returns' },
  { key: 'archive', icon: 'fa-box-archive', label: 'Archive' },
  { key: 'profile', icon: 'fa-circle-user', label: 'My Profile' },
];

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [inventoryReport, setInventoryReport] = useState([]);
  const [salesReport, setSalesReport] = useState([]);
  const [orderStatusReport, setOrderStatusReport] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchData = async () => {
    setInitialLoading(true);
    try {
      const userRes = await api.get('/api/user');
      const userData = userRes.data;
      if (userData.role !== 'admin') {
        if (userData.role === 'customer') navigate('/customer-dashboard');
        else if (userData.role === 'staff') navigate('/staff-dashboard');
        else if (userData.role === 'rider') navigate('/rider-dashboard');
        else navigate('/login');
        return;
      }
      setUser(userData);
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/products'),
        api.get('/api/orders'),
      ]);
      setUsers(usersRes.data);
      setProducts(productsRes.data.data || []);
      setOrders(ordersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchInventory = () => {
    api.get('/api/reports/inventory').then(res => setInventoryReport(res.data)).catch(err => console.error(err));
  };
  const fetchSales = () => {
    api.get('/api/reports/sales').then(res => setSalesReport(res.data)).catch(err => console.error(err));
  };
  const fetchOrderStatus = () => {
    api.get('/api/reports/orders').then(res => setOrderStatusReport(res.data)).catch(err => console.error(err));
  };

  const handleLogout = () => {
    api.post('/api/logout').finally(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  };

  const statCards = [
    { label: 'Total Users', value: users.length, icon: 'fa-users', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', change: '+12%' },
    { label: 'Total Products', value: products.length, icon: 'fa-box-open', color: '#10b981', bg: 'rgba(16,185,129,0.08)', change: '+8%' },
    { label: 'Total Orders', value: orders.length, icon: 'fa-cart-shopping', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', change: '+5%' },
    { label: 'Active Staff', value: users.filter(u => u.role === 'staff').length, icon: 'fa-id-badge', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', change: '+2' },
  ];

  const roleBadge = (role) => {
    const map = { admin: { bg: '#fee2e2', color: '#dc2626', label: 'Admin' }, staff: { bg: '#dbeafe', color: '#2563eb', label: 'Staff' }, rider: { bg: '#fef3c7', color: '#d97706', label: 'Rider' }, customer: { bg: '#f0fdf4', color: '#16a34a', label: 'Customer' } };
    const s = map[role] || { bg: '#f1f5f9', color: '#64748b', label: role };
    return <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>;
  };

  const getStatusBadge = (status) => {
    const map = { received: { bg: '#e0f2fe', color: '#0284c7' }, quality_check: { bg: '#fef3c7', color: '#b45309' }, ready_for_pickup: { bg: '#ede9fe', color: '#7c3aed' }, shipped: { bg: '#dbeafe', color: '#1d4ed8' }, delivered: { bg: '#dcfce7', color: '#15803d' }, cancelled: { bg: '#fee2e2', color: '#dc2626' } };
    const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
    return <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{(status || '').replace(/_/g, ' ')}</span>;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
      {/* Subtle Top Progress Bar */}
      {initialLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.2)', zIndex: 9999, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: ACCENT, width: '30%', animation: 'loadingBar 1.5s infinite ease-in-out' }} />
        </div>
      )}

      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(400%); width: 30%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .admin-nav-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .admin-stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
        .admin-table-row:hover { background: #f8fafc !important; }
        .admin-main-content { animation: fadeIn 0.3s ease; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 280, background: SIDEBAR_BG, color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', height: '100vh', left: 0, top: 0,
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)', zIndex: 100,
        borderRight: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#FFF', fontFamily: 'Outfit, sans-serif' }}>StepUp</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '24px 16px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button
              key={item.key}
              className="admin-nav-btn"
              onClick={() => setActiveTab(item.key)}
              style={{
                width: '100%', padding: '14px 20px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 16, borderRadius: '12px',
                marginBottom: '8px', textAlign: 'left', fontSize: '15px', fontWeight: activeTab === item.key ? '600' : '500',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                background: activeTab === item.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === item.key ? '#FFF' : 'rgba(255,255,255,0.6)',
                boxShadow: activeTab === item.key ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <i className={`fas ${item.icon}`} style={{ width: 20, fontSize: 16, color: activeTab === item.key ? '#FFF' : 'rgba(255,255,255,0.4)' }} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '16px 16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700
            }}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name || 'Loading...'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '9px 14px', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            <i className="fas fa-arrow-right-from-bracket" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ marginLeft: 280, flex: 1, padding: '48px', minHeight: '100vh', opacity: initialLoading ? 0.7 : 1, transition: 'opacity 0.3s' }} className="admin-main-content">

        {activeTab === 'dashboard' && (
          <div className="animate-up">
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.5px' }}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name ? user.name.split(' ')[0] : '...'}! 👋
              </h1>
              <p style={{ color: '#757575', margin: '8px 0 0', fontSize: 16 }}>Here's what's happening on your platform today.</p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
              {statCards.map((card, i) => (
                <div key={i} className="card hover-lift" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '13px', color: '#757575', margin: '0 0 12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</p>
                      <p style={{ fontSize: '40px', fontWeight: '800', color: '#111', margin: '0', lineHeight: 1 }}>{card.value}</p>
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fas ${card.icon}`} style={{ fontSize: 24, color: card.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Two-col overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* Recent Users */}
              <div className="card hover-lift">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(250,84,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-users" style={{ color: ACCENT, fontSize: 14 }} /> 
                    </div>
                    Recent Users
                  </h3>
                  <button onClick={() => setActiveTab('users')} style={{ background: 'none', border: 'none', color: '#757575', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#111'} onMouseLeave={e=>e.currentTarget.style.color='#757575'}>View all &rarr;</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Name', 'Email', 'Role'].map(h => (
                        <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map(u => (
                      <tr key={u.id} style={{ transition: 'background 0.2s', borderBottom: '1px solid rgba(0,0,0,0.02)' }} onMouseEnter={e=>e.currentTarget.style.background='#F8F9FA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding: '16px 32px', fontSize: 14, fontWeight: 700, color: '#111' }}>{u.name}</td>
                        <td style={{ padding: '16px 32px', fontSize: 14, color: '#757575' }}>{u.email}</td>
                        <td style={{ padding: '16px 32px' }}>{roleBadge(u.role)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: '#999', fontSize: 14 }}>No users yet</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Recent Orders */}
              <div className="card hover-lift">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(250,84,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-cart-shopping" style={{ color: ACCENT, fontSize: 14 }} />
                    </div>
                    Recent Orders
                  </h3>
                  <button onClick={() => setActiveTab('reports')} style={{ background: 'none', border: 'none', color: '#757575', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#111'} onMouseLeave={e=>e.currentTarget.style.color='#757575'}>View all &rarr;</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Order', 'Customer', 'Status'].map(h => (
                        <th key={h} style={{ padding: '16px 32px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id} style={{ transition: 'background 0.2s', borderBottom: '1px solid rgba(0,0,0,0.02)' }} onMouseEnter={e=>e.currentTarget.style.background='#F8F9FA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding: '16px 32px', fontSize: 14, fontWeight: 700, color: '#111' }}>#{o.id}</td>
                        <td style={{ padding: '16px 32px', fontSize: 14, color: '#757575' }}>{o.user?.name || '—'}</td>
                        <td style={{ padding: '16px 32px' }}>{getStatusBadge(o.status)}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: '#999', fontSize: 14 }}>No orders yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Reports */}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Quick Reports</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
                {[
                  { title: 'Inventory Report', icon: 'fa-warehouse', color: '#6366f1', action: fetchInventory, data: inventoryReport, cols: ['name', 'stock'] },
                  { title: 'Sales Report', icon: 'fa-chart-line', color: '#10b981', action: fetchSales, data: salesReport, cols: ['product_id', 'total_sales'] },
                  { title: 'Order Status', icon: 'fa-clipboard-list', color: '#f59e0b', action: fetchOrderStatus, data: orderStatusReport, cols: ['id', 'status'] },
                ].map((r, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className={`fas ${r.icon}`} style={{ color: r.color }} /> {r.title}
                      </h4>
                    </div>
                    <div style={{ padding: 20 }}>
                      <button onClick={r.action} style={{
                        width: '100%', padding: '10px', border: 'none', borderRadius: 8,
                        background: r.color, color: '#fff', cursor: 'pointer', fontSize: 13,
                        fontWeight: 600, fontFamily: 'Outfit, sans-serif', marginBottom: r.data.length > 0 ? 14 : 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}>
                        <i className="fas fa-rotate-right" /> Generate
                      </button>
                      {r.data.slice(0, 3).map((item, j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: j < 2 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>{r.cols[0] === 'product_id' ? `Product #${item[r.cols[0]]}` : r.cols[0] === 'id' ? `Order #${item[r.cols[0]]}` : item[r.cols[0]]}</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{r.cols[1] === 'total_sales' ? `₱${item[r.cols[1]]}` : r.cols[1] === 'stock' ? `${item[r.cols[1]]} units` : item[r.cols[1]]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'promotions' && <SalesManager />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'profile' && <AdminProfile />}
        {activeTab === 'logistics' && <LogisticsManager />}
        {activeTab === 'riders' && <RiderManager />}
        {activeTab === 'reviews' && <ReviewManager />}
        {activeTab === 'returns' && <ReturnManager />}
        {activeTab === 'archive' && <ArchiveManager />}
        {activeTab === 'analytics' && <AdminAnalytics />}
      </main>
    </div>
  );
};

export default AdminDashboard;
