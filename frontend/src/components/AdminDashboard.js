import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [inventoryReport, setInventoryReport] = useState([]);
  const [salesReport, setSalesReport] = useState([]);
  const [orderStatusReport, setOrderStatusReport] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Only fetch data if authenticated
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const userRes = await axios.get('/api/user');
      setUser(userRes.data);
      
      const usersRes = await axios.get('/api/users');
      setUsers(usersRes.data);
      
      const productsRes = await axios.get('/api/products');
      setProducts(productsRes.data.data);
      
      const ordersRes = await axios.get('/api/orders');
      setOrders(ordersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
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
      console.error('Logout failed:', err);
      // Force logout even if API call fails
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  };

  if (!user) return <div className="d-flex justify-content-center"><div className="spinner-border" role="status"><span className="sr-only">Loading...</span></div></div>;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <i className="fas fa-crown text-warning"></i>
            <h3 className="text-gradient mb-0">Admin Panel</h3>
          </div>
          <div className="sidebar-actions">
            <button className="btn btn-sm btn-outline-light" onClick={handleLogout} title="Logout">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${location.pathname === '/admin-dashboard' ? 'active' : ''}`} onClick={() => navigate('/admin-dashboard')}>
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </button>
          <button className={`nav-item ${location.pathname === '/admin-users' ? 'active' : ''}`} onClick={() => navigate('/admin-users')}>
            <i className="fas fa-users"></i>
            <span>Users</span>
          </button>
          <button className={`nav-item ${location.pathname === '/admin-products' ? 'active' : ''}`} onClick={() => navigate('/admin-products')}>
            <i className="fas fa-box"></i>
            <span>Products</span>
          </button>
          <button className={`nav-item ${location.pathname === '/admin-reports' ? 'active' : ''}`} onClick={() => navigate('/admin-reports')}>
            <i className="fas fa-chart-bar"></i>
            <span>Reports</span>
          </button>
          <button className={`nav-item ${location.pathname === '/admin-profile' ? 'active' : ''}`} onClick={() => navigate('/admin-profile')}>
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">
              <i className="fas fa-chart-line text-primary"></i>
              Dashboard Overview
            </h1>
            <p className="dashboard-subtitle">Welcome back, {user?.name}! Here's what's happening with your platform.</p>
          </div>
          <div className="header-actions">
            <div className="date-display">
              <i className="fas fa-calendar-alt"></i>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{users.length}</h3>
              <p className="stat-label">Total Users</p>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                <span>+12%</span>
              </div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-box"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{products.length}</h3>
              <p className="stat-label">Total Products</p>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                <span>+8%</span>
              </div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{orders.length}</h3>
              <p className="stat-label">Total Orders</p>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                <span>+15%</span>
              </div>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-number">${orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2)}</h3>
              <p className="stat-label">Total Revenue</p>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                <span>+23%</span>
              </div>
            </div>
          </div>
        </div>
        {/* Quick Overview Tables */}
        <div className="overview-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-eye"></i>
              Quick Overview
            </h2>
            <p className="section-subtitle">Recent activity and key metrics at a glance</p>
          </div>

          <div className="overview-grid">
            <div className="overview-card">
              <div className="card-header-modern">
                <div className="card-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="card-title-section">
                  <h3>User Management</h3>
                  <p>Manage user accounts and permissions</p>
                </div>
                <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/admin-users')}>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
              <div className="table-container">
                <table className="modern-table">
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
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${u.active ? 'active' : 'inactive'}`}>
                            {u.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-header-modern">
                <div className="card-icon">
                  <i className="fas fa-box"></i>
                </div>
                <div className="card-title-section">
                  <h3>Product Management</h3>
                  <p>Monitor and manage your product catalog</p>
                </div>
                <button className="btn btn-outline-success btn-sm" onClick={() => navigate('/admin-products')}>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-image">
                              <i className="fas fa-image"></i>
                            </div>
                            <span>{p.name}</span>
                          </div>
                        </td>
                        <td>{p.brand}</td>
                        <td className="price-cell">${p.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        {/* Reports Section */}
        <div className="reports-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-chart-bar"></i>
              Analytics & Reports
            </h2>
            <p className="section-subtitle">Generate detailed reports and insights</p>
          </div>

          <div className="reports-grid">
            <div className="report-card">
              <div className="report-header">
                <div className="report-icon inventory">
                  <i className="fas fa-warehouse"></i>
                </div>
                <div className="report-info">
                  <h4>Inventory Report</h4>
                  <p>Track stock levels and inventory status</p>
                </div>
              </div>
              <div className="report-actions">
                <button className="btn btn-warning btn-block" onClick={fetchInventory}>
                  <i className="fas fa-play"></i>
                  Generate Report
                </button>
              </div>
              {inventoryReport.length > 0 && (
                <div className="report-results">
                  <div className="results-header">
                    <span>{inventoryReport.length} items found</span>
                  </div>
                  <div className="results-table">
                    <table className="modern-table compact">
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
                              <span className={`stock-badge ${item.stock > 10 ? 'good' : item.stock > 0 ? 'low' : 'out'}`}>
                                {item.stock}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="report-card">
              <div className="report-header">
                <div className="report-icon sales">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="report-info">
                  <h4>Sales Report</h4>
                  <p>Analyze sales performance and trends</p>
                </div>
              </div>
              <div className="report-actions">
                <button className="btn btn-info btn-block" onClick={fetchSales}>
                  <i className="fas fa-play"></i>
                  Generate Report
                </button>
              </div>
              {salesReport.length > 0 && (
                <div className="report-results">
                  <div className="results-header">
                    <span>{salesReport.length} products analyzed</span>
                  </div>
                  <div className="results-table">
                    <table className="modern-table compact">
                      <thead>
                        <tr>
                          <th>Product ID</th>
                          <th>Total Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReport.slice(0, 3).map(item => (
                          <tr key={item.id}>
                            <td>#{item.product_id}</td>
                            <td className="sales-amount">${item.total_sales}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="report-card">
              <div className="report-header">
                <div className="report-icon orders">
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <div className="report-info">
                  <h4>Order Status Report</h4>
                  <p>Monitor order fulfillment and status</p>
                </div>
              </div>
              <div className="report-actions">
                <button className="btn btn-secondary btn-block" onClick={fetchOrderStatus}>
                  <i className="fas fa-play"></i>
                  Generate Report
                </button>
              </div>
              {orderStatusReport.length > 0 && (
                <div className="report-results">
                  <div className="results-header">
                    <span>{orderStatusReport.length} orders tracked</span>
                  </div>
                  <div className="results-table">
                    <table className="modern-table compact">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderStatusReport.slice(0, 3).map(item => (
                          <tr key={item.id}>
                            <td>#{item.id}</td>
                            <td>
                              <span className={`status-badge ${item.status.toLowerCase()}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
    </div>
  );
};

export default AdminDashboard;