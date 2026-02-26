import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminUsers from './AdminUsers';
import AdminProducts from './AdminProducts';
import AdminReports from './AdminReports';
import AdminProfile from './AdminProfile';
import axios from 'axios';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [inventoryReport, setInventoryReport] = useState([]);
  const [salesReport, setSalesReport] = useState([]);
  const [orderStatusReport, setOrderStatusReport] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const userRes = await axios.get('/api/user');
      setUser(userRes.data);
      
      const usersRes = await axios.get('/api/users');
      setUsers(usersRes.data);
      
      const productsRes = await axios.get('/api/products');
      setProducts(productsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const fetchInventory = () => {
    axios.get('/api/reports/inventory').then(res => setInventoryReport(res.data)).catch(err => console.error('Failed to fetch inventory report:', err));
  };

  const fetchSales = () => {
    axios.get('/api/reports/sales').then(res => setSalesReport(res.data)).catch(err => console.error('Failed to fetch sales report:', err));
  };

  const fetchOrderStatus = () => {
    axios.get('/api/reports/orders').then(res => setOrderStatusReport(res.data)).catch(err => console.error('Failed to fetch order status report:', err));
  };

  const handleLogout = () => {
    axios.post('/api/logout').then(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    }).catch(err => {
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  };

  if (!user) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><div className="spinner"></div></div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAFA' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#111',
        color: '#FFF',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-crown"></i>
            Admin Panel
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          <button style={{
            width: '100%',
            padding: '14px 24px',
            background: activeTab === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            color: '#FFF',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: activeTab === 'dashboard' ? '3px solid #FFF' : '3px solid transparent',
            transition: 'all 0.2s'
          }} onClick={() => setActiveTab('dashboard')}>
            <i className="fas fa-tachometer-alt" style={{ width: '20px' }}></i>
            <span>Dashboard</span>
          </button>
          <button style={{
            width: '100%',
            padding: '14px 24px',
            background: activeTab === 'users' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            color: '#FFF',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: activeTab === 'users' ? '3px solid #FFF' : '3px solid transparent',
            transition: 'all 0.2s'
          }} onClick={() => setActiveTab('users')}>
            <i className="fas fa-users" style={{ width: '20px' }}></i>
            <span>Users</span>
          </button>
          <button style={{
            width: '100%',
            padding: '14px 24px',
            background: activeTab === 'products' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            color: '#FFF',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: activeTab === 'products' ? '3px solid #FFF' : '3px solid transparent',
            transition: 'all 0.2s'
          }} onClick={() => setActiveTab('products')}>
            <i className="fas fa-box" style={{ width: '20px' }}></i>
            <span>Products</span>
          </button>
          <button style={{
            width: '100%',
            padding: '14px 24px',
            background: activeTab === 'reports' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            color: '#FFF',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: activeTab === 'reports' ? '3px solid #FFF' : '3px solid transparent',
            transition: 'all 0.2s'
          }} onClick={() => setActiveTab('reports')}>
            <i className="fas fa-chart-bar" style={{ width: '20px' }}></i>
            <span>Reports</span>
          </button>
          <button style={{
            width: '100%',
            padding: '14px 24px',
            background: activeTab === 'profile' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            color: '#FFF',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: activeTab === 'profile' ? '3px solid #FFF' : '3px solid transparent',
            transition: 'all 0.2s'
          }} onClick={() => setActiveTab('profile')}>
            <i className="fas fa-user" style={{ width: '20px' }}></i>
            <span>Profile</span>
          </button>
        </nav>
        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{
            width: '100%',
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#FFF',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            borderRadius: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '32px' }}>
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            {/* Welcome Hero Section */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-light) 100%)',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-2xl)',
              marginBottom: 'var(--spacing-2xl)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div style={{flex: 1}}>
                  <h1 style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: 'var(--spacing-md)',
                    color: 'white'
                  }}>Welcome back, {user?.name}!</h1>
                  <p style={{
                    fontSize: 'var(--font-size-lg)',
                    margin: 0,
                    opacity: 0.95,
                    lineHeight: 1.6
                  }}>Here's what's happening with your platform today. Monitor your users, products, orders, and revenue in real-time.</p>
                </div>
                <div style={{
                  fontSize: '4rem',
                  opacity: 0.15,
                  marginLeft: 'var(--spacing-lg)'
                }}>
                  <i className="fas fa-crown"></i>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid" style={{marginBottom: 'var(--spacing-2xl)'}}>
              <div className="metric-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <p className="metric-label">Total Users</p>
                    <p className="metric-value">{users.length}</p>
                    <p className="metric-change positive">
                      <i className="fas fa-arrow-up"></i> +12%
                    </p>
                  </div>
                  <div style={{fontSize: '2.5rem', color: 'var(--primary-light)', opacity: 0.2}}>
                    <i className="fas fa-users"></i>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <p className="metric-label">Total Products</p>
                    <p className="metric-value">{products.length}</p>
                    <p className="metric-change positive">
                      <i className="fas fa-arrow-up"></i> +8%
                    </p>
                  </div>
                  <div style={{fontSize: '2.5rem', color: 'var(--success-green)', opacity: 0.2}}>
                    <i className="fas fa-box"></i>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <p className="metric-label">Total Products</p>
                    <p className="metric-value">{products.length}</p>
                    <p className="metric-change positive">
                      <i className="fas fa-arrow-up"></i> +8%
                    </p>
                  </div>
                  <div style={{fontSize: '2.5rem', color: 'var(--info-cyan)', opacity: 0.2}}>
                    <i className="fas fa-boxes"></i>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <p className="metric-label">Active Users</p>
                    <p className="metric-value">{users.length}</p>
                    <p className="metric-change positive">
                      <i className="fas fa-arrow-up"></i> +12%
                    </p>
                  </div>
                  <div style={{fontSize: '2.5rem', color: 'var(--success-green)', opacity: 0.2}}>
                    <i className="fas fa-user-check"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview Cards */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)'}}>
              {/* Users Overview */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <span style={{width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <i className="fas fa-users"></i>
                    </span>
                    Recent Users
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('users')}>View All</button>
                </div>
                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 5).map(u => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td><span className="badge badge-primary">{u.role}</span></td>
                          <td><span className="badge badge-success">Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Products Overview */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <span style={{width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--success-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <i className="fas fa-box"></i>
                    </span>
                    Recent Products
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('products')}>View All</button>
                </div>
                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 5).map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.brand}</td>
                          <td style={{fontWeight: 600, color: 'var(--success-green)'}}>${p.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div>
              <h2 style={{fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--spacing-lg)'}}>Reports & Analytics</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)'}}>
                <div className="card">
                  <div className="card-header">
                    <h4 style={{margin: 0}}>
                      <i className="fas fa-warehouse"></i> Inventory Report
                    </h4>
                  </div>
                  <div className="card-body">
                    <button className="btn btn-primary w-full mb-lg" onClick={fetchInventory}>
                      <i className="fas fa-refresh"></i> Generate Report
                    </button>
                    {inventoryReport.length > 0 && (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReport.slice(0, 3).map(item => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>
                                <span className={`badge ${item.stock > 10 ? 'badge-success' : item.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                                  {item.stock} units
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h4 style={{margin: 0}}>
                      <i className="fas fa-chart-line"></i> Sales Report
                    </h4>
                  </div>
                  <div className="card-body">
                    <button className="btn btn-primary w-full mb-lg" onClick={fetchSales}>
                      <i className="fas fa-refresh"></i> Generate Report
                    </button>
                    {salesReport.length > 0 && (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Sales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesReport.slice(0, 3).map(item => (
                            <tr key={item.id}>
                              <td>#{item.product_id}</td>
                              <td style={{fontWeight: 600, color: 'var(--success-green)'}}>${item.total_sales}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h4 style={{margin: 0}}>
                      <i className="fas fa-clipboard-list"></i> Order Status
                    </h4>
                  </div>
                  <div className="card-body">
                    <button className="btn btn-primary w-full mb-lg" onClick={fetchOrderStatus}>
                      <i className="fas fa-refresh"></i> Generate Report
                    </button>
                    {orderStatusReport.length > 0 && (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Order</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderStatusReport.slice(0, 3).map(item => (
                            <tr key={item.id}>
                              <td>#{item.id}</td>
                              <td><span className="badge badge-info">{item.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'profile' && <AdminProfile />}
      </main>
    </div>
  );
};

export default AdminDashboard;
