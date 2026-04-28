import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Notification from './Notification';
import OrderManagement from './OrderManagement';
import ProductManager from './ProductManager';
import SalesManager from './SalesManager';
import { buildApiAssetUrl } from '../utils/apiUrl';

const SIDEBAR_BG = 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)';

const getLogisticStyle = (name) => {
  if (!name) return { color: '#64748b', bg: '#f1f5f9', icon: 'fa-shop', label: 'Store Management' };
  if (name.toLowerCase().includes('jnt') || name.toLowerCase().includes('j&t')) {
    return { color: '#d97706', bg: '#fef3c7', icon: 'fa-truck-fast', label: 'J&T Express' };
  }
  if (name.toLowerCase().includes('lbc')) {
    return { color: '#dc2626', bg: '#fee2e2', icon: 'fa-box-open', label: 'LBC Express' };
  }
  return { color: '#6366f1', bg: '#ede9fe', icon: 'fa-truck', label: name };
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pendingOrders: 0, qualityCheck: 0, readyForPickup: 0, deliveredOrders: 0, totalSales: 0 });
  const [activeTab, setActiveTabState] = useState(() => localStorage.getItem('staffDashboardTab') || 'dashboard');
  const setActiveTab = (tab) => { setActiveTabState(tab); localStorage.setItem('staffDashboardTab', tab); };
  const [notification, setNotification] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Product Management States (for Store Staff)
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', brand: '', type: '', price: '', gender: 'Men', image: null, imagePreview: null, skus: []
  });
  const [newSku, setNewSku] = useState({ size: '', color: '', width: '', stock: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (showInitialLoader = false) => {
    if (showInitialLoader) setInitialLoading(true);
    try {
      const userRes = await api.get('/api/user');
      const userData = userRes.data;
      if (userData.role !== 'staff') {
        if (userData.role === 'customer') navigate('/customer-dashboard');
        else if (userData.role === 'admin') navigate('/admin-dashboard');
        else navigate('/login');
        return;
      }
      setUser(userData);
      
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/api/orders'),
        userData.logistic_id ? Promise.resolve({ data: { data: [] } }) : api.get('/api/products?limit=1000')
      ]);

      const allOrders = ordersRes.data.data || [];
      const ordersList = userData.logistic_id ? allOrders.filter(o => o.logistics_id === userData.logistic_id) : allOrders;
      setOrders(ordersList);
      
      if (!userData.logistic_id) {
        const staffProducts = (productsRes.data.data || []).filter(p => p.seller_id === userData.id);
        setProducts(staffProducts);
      }

      const pending = ordersList.filter(o => o.status === 'received').length;
      const qc = ordersList.filter(o => o.status === 'quality_check').length;
      const ready = ordersList.filter(o => o.status === 'ready_for_pickup').length;
      const delivered = ordersList.filter(o => o.status === 'delivered').length;
      const sales = ordersList.filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      
      setStats({ pendingOrders: pending, qualityCheck: qc, readyForPickup: ready, deliveredOrders: delivered, totalSales: sales.toFixed(2) });
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
      if (error.response?.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; }
    } finally {
      if (showInitialLoader) setInitialLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData(true);
  }, [fetchData, navigate]);

  const handleLogout = () => api.post('/api/logout').finally(() => { localStorage.removeItem('token'); window.location.href = '/'; });

  // Product Manager Handlers
  const handleEditProductFromManager = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '', description: product.description || '', brand: product.brand || '', type: product.type || '',
      price: product.price != null ? String(product.price) : '', gender: product.gender || 'Men', image: null,
      imagePreview: product.image ? buildApiAssetUrl(`/storage/${product.image}`) : null,
      skus: Array.isArray(product.skus) ? product.skus.map(s => ({ size: s.size || '', color: s.color || '', width: s.width || '', stock: parseInt(s.stock, 10) || 0 })) : []
    });
    setShowAddProductForm(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => { if (key !== 'skus' && key !== 'imagePreview') data.append(key, formData[key]); });
    data.append('skus', JSON.stringify(formData.skus));
    if (editingProduct) data.append('_method', 'PUT');

    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    api.post(url, data)
      .then(() => { setShowAddProductForm(false); setEditingProduct(null); setNotification({ message: 'Success!', type: 'success' }); fetchData(); })
      .catch(() => setNotification({ message: 'Error saving product', type: 'error' }))
      .finally(() => setLoading(false));
  };

  const logisticStyle = getLogisticStyle(user?.logistic?.name);

  const navItems = [
    { key: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
    { key: 'manage-orders', icon: 'fa-bags-shopping', label: 'Order Management' },
    ...(!(user?.logistic_id) ? [
      { key: 'manage-products', icon: 'fa-box-open', label: 'Products' },
      { key: 'sales', icon: 'fa-tag', label: 'Sales & Promos' }
    ] : []),
    { key: 'profile', icon: 'fa-circle-user', label: 'My Profile' },
  ];

  const statCards = user?.logistic_id ? [
    { label: 'New Orders', value: stats.pendingOrders, icon: 'fa-inbox', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    { label: 'In Quality Check', value: stats.qualityCheck, icon: 'fa-magnifying-glass', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Ready for Pickup', value: stats.readyForPickup, icon: 'fa-truck-ramp-box', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    { label: 'Completed', value: stats.deliveredOrders, icon: 'fa-circle-check', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  ] : [
    { label: 'Total Sales', value: `₱${stats.totalSales}`, icon: 'fa-peso-sign', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: 'fa-clock', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Active Products', value: products.length, icon: 'fa-box', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    { label: 'Completed', value: stats.deliveredOrders, icon: 'fa-circle-check', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  ];

  const getStatusBadge = (status) => {
    const map = { received: '#0ea5e9', quality_check: '#f59e0b', ready_for_pickup: '#8b5cf6', shipped: '#3b82f6', delivered: '#10b981', cancelled: '#ef4444' };
    const c = map[status] || '#64748b';
    return <span style={{ background: `${c}18`, color: c, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{(status || '').replace(/_/g, ' ')}</span>;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
      {/* Subtle Top Progress Bar */}
      {initialLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.2)', zIndex: 9999, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#10b981', width: '30%', animation: 'loadingBar 1.5s infinite ease-in-out' }} />
        </div>
      )}

      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(400%); width: 30%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } } 
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } } 
        .staff-nav-btn:hover { background: rgba(255,255,255,0.08) !important; } 
        .staff-stat-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.12)!important; } 
        .staff-row:hover { background:#f8fafc!important; }
      `}</style>

      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      <aside style={{
        width: 260, background: SIDEBAR_BG, color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', height: '100vh', left: 0, top: 0,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)', zIndex: 100
      }}>
        <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`fas ${logisticStyle.icon}`} style={{ fontSize: 18, color: '#111' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: '#FFF' }}>{logisticStyle.label}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Portal</span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '24px 0' }}>
          {navItems.map(item => (
            <button key={item.key} className="staff-nav-btn" onClick={() => setActiveTab(item.key)}
              style={{
                width: '100%', padding: '14px 24px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontSize: '14px', 
                fontWeight: activeTab === item.key ? '700' : '500', transition: 'all 0.2s',
                background: activeTab === item.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === item.key ? '#FFF' : 'rgba(255,255,255,0.5)',
                borderLeft: activeTab === item.key ? '4px solid #f59e0b' : '4px solid transparent',
              }}>
              <i className={`fas ${item.icon}`} style={{ width: 18 }} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{user?.name?.charAt(0).toUpperCase() || '?'}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || 'Loading...'}</div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Sign Out</button>
        </div>
      </aside>

      <main style={{ marginLeft: 260, flex: 1, padding: 40, animation: 'fadeIn 0.3s ease', opacity: initialLoading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>{user?.logistic_id ? 'Logistics Dashboard' : 'Store Dashboard'}</h1>
              <p style={{ color: '#64748b', marginTop: 4 }}>Managing {user?.logistic_id ? `shipments for ${logisticStyle.label}` : 'your store operations'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 32 }}>
              {statCards.map((card, i) => (
                <div key={i} className="staff-stat-card" style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 4px', fontWeight: 600 }}>{card.label}</p>
                      <p style={{ fontSize: card.value?.toString().length > 8 ? 24 : 32, fontWeight: 800, color: '#0f172a', margin: 0 }}>{card.value}</p>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fas ${card.icon}`} style={{ color: card.color, fontSize: 20 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Recent Orders</h3>
                <button onClick={() => setActiveTab('manage-orders')} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer' }}>View All</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Order', 'Customer', 'Status', 'Date'].map(h => <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 700 }}>#{o.id}</td>
                      <td style={{ padding: '16px 24px' }}>{o.user?.name}</td>
                      <td style={{ padding: '16px 24px' }}>{getStatusBadge(o.status)}</td>
                      <td style={{ padding: '16px 24px', color: '#94a3b8', fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No orders found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'manage-orders' && <OrderManagement />}
        {activeTab === 'manage-products' && (
          <ProductManager
            products={products} onEdit={handleEditProductFromManager} onDelete={() => fetchData()}
            showForm={showAddProductForm} setShowForm={setShowAddProductForm} formData={formData}
            editingProduct={editingProduct} setEditingProduct={setEditingProduct}
            handleInputChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
            handleImageChange={(e) => { const file = e.target.files[0]; if (file) setFormData({ ...formData, image: file, imagePreview: URL.createObjectURL(file) }); }}
            handleAddSku={() => { if (!newSku.size || !newSku.color || !newSku.stock) return; setFormData({ ...formData, skus: [...formData.skus, { ...newSku, stock: parseInt(newSku.stock) }] }); setNewSku({ size: '', color: '', width: '', stock: '' }); }}
            handleRemoveSku={(index) => setFormData({ ...formData, skus: formData.skus.filter((_, i) => i !== index) })}
            handleAddProduct={handleAddProduct} newSku={newSku} handleSkuInputChange={(e) => setNewSku({ ...newSku, [e.target.name]: e.target.value })}
            setFormData={setFormData} loading={loading}
          />
        )}
        {activeTab === 'sales' && <SalesManager />}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Account Settings</h2>
            <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>{user?.name?.charAt(0).toUpperCase() || '?'}</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.name || '...'}</div>
                    <div style={{ color: '#64748b' }}>{user?.email}</div>
                  </div>
               </div>
               <div style={{ display: 'grid', gap: 16 }}>
                  {[
                    ['Role', 'Staff Member'],
                    ['Assigned Channel', user?.logistic?.name || 'Store (Unassigned)'],
                    ['Account Status', 'Verified & Active']
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontWeight: 700 }}>{val}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
