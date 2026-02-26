import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Notification from './Notification';
import SalesManager from './SalesManager';
import OrderManagement from './OrderManagement';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, activeProducts: 0, pendingOrders: 0 });
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('sellerDashboardTab') || 'dashboard';
  });
  
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('sellerDashboardTab', tab);
  };
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    type: '',
    price: '',
    gender: 'Men',
    image: null,
    imagePreview: null,
    skus: []
  });
  const [newSku, setNewSku] = useState({
    size: '',
    color: '',
    width: '',
    stock: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Set authorization header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setInitialLoading(true);
    try {
      // Fetch user data
      const userRes = await axios.get('/api/user');
      setUser(userRes.data);
      
      // Fetch ALL products (no pagination limit) for this seller
      const productsRes = await axios.get('/api/products?limit=1000');
      const allProducts = productsRes.data.data || [];
      const sellerProducts = allProducts.filter(p => p.seller_id === userRes.data.id);
      setProducts(sellerProducts);
      
      // Fetch orders
      const ordersRes = await axios.get('/api/orders');
      const ordersList = ordersRes.data.data || [];
      setOrders(ordersList);
      
      // Calculate stats
      const totalSales = ordersList.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const activeProducts = sellerProducts.length;
      const pendingOrders = ordersList.filter(o => o.status !== 'completed').length;
      
      setStats({ totalSales: totalSales.toFixed(2), activeProducts, pendingOrders });
      setInitialLoading(false);
    } catch (error) {
      console.error('Failed to fetch seller data:', error);
      setInitialLoading(false);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    axios.put(`/api/orders/${orderId}`, { status: newStatus })
      .then(() => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        setNotification({ message: 'Order status updated successfully!', type: 'success' });
      })
      .catch(err => {
        console.error('Order status update error:', err.response?.data);
        const errorMsg = err.response?.data?.errors?.status?.[0] || 'Failed to update order status';
        setNotification({ message: errorMsg, type: 'error' });
      });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkuInputChange = (e) => {
    setNewSku({
      ...newSku,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSku = () => {
    if (!newSku.size || !newSku.color || !newSku.stock) {
      setNotification({ message: 'Please fill in size, color, and stock for the SKU', type: 'error' });
      return;
    }
    setFormData({
      ...formData,
      skus: [...formData.skus, { ...newSku, stock: parseInt(newSku.stock) }]
    });
    setNewSku({ size: '', color: '', width: '', stock: '' });
    setNotification({ message: 'SKU added!', type: 'success' });
  };

  const handleRemoveSku = (index) => {
    setFormData({
      ...formData,
      skus: formData.skus.filter((_, i) => i !== index)
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      setNotification({ message: 'Please fill in product name and price', type: 'error' });
      return;
    }

    if (!editingProduct && !formData.image) {
      setNotification({ message: 'Please select a product image', type: 'error' });
      return;
    }

    if (formData.skus.length === 0) {
      setNotification({ message: 'Please add at least one size/color option', type: 'error' });
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('brand', formData.brand);
    data.append('type', formData.type);
    data.append('price', parseFloat(formData.price));
    data.append('gender', formData.gender);
    
    // Only append image if a new one is selected
    if (formData.image) {
      data.append('image', formData.image);
    }
    
    // Add SKUs as JSON
    data.append('skus', JSON.stringify(formData.skus));

    // Add _method for PUT request when editing
    if (editingProduct) {
      data.append('_method', 'PUT');
    }

    const token = localStorage.getItem('token');
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    
    axios.post(url, data, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(res => {
        console.log('Product saved successfully:', res.data);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          brand: '',
          type: '',
          price: '',
          gender: 'Men',
          image: null,
          imagePreview: null,
          skus: []
        });
        setNewSku({ size: '', color: '', width: '', stock: '' });
        setShowAddProductForm(false);
        setEditingProduct(null);
        setNotification({ 
          message: editingProduct ? 'Product updated successfully!' : 'Product added successfully!', 
          type: 'success' 
        });
        
        // Refresh products list
        fetchData();
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Product submission error:', err.response?.data || err.message);
        
        let errorMsg = editingProduct ? 'Failed to update product' : 'Failed to add product';
        
        // Handle validation errors from backend
        if (err.response?.data?.errors) {
          const errors = err.response.data.errors;
          const firstError = Object.values(errors)[0];
          if (Array.isArray(firstError)) {
            errorMsg = firstError[0];
          } else {
            errorMsg = firstError || errorMsg;
          }
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        }
        
        setNotification({ message: errorMsg, type: 'error' });
        setLoading(false);
      });
  };

  const handleLogout = () => {
    axios.post('/api/logout').then(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    }).catch(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  };

  if (initialLoading || !user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#FAFAFA'
      }}>
        <div style={{textAlign: 'center'}}>
          <div className="spinner-border" style={{width: '50px', height: '50px', borderWidth: '3px', color: '#111'}} />
          <p style={{marginTop: '20px', fontSize: '18px', fontWeight: '600', color: '#111'}}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAFA' }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
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
            <i className="fas fa-store"></i>
            Seller Hub
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
            <span>My Products</span>
          </button>
          <button style={{
            width: '100%',
            padding: '14px 24px',
            background: activeTab === 'analytics' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            color: '#FFF',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: activeTab === 'analytics' ? '3px solid #FFF' : '3px solid transparent',
            transition: 'all 0.2s'
          }} onClick={() => setActiveTab('analytics')}>
            <i className="fas fa-chart-bar" style={{ width: '20px' }}></i>
            <span>Analytics</span>
          </button>
          <button style={{
            width: '100%',
            padding: '14px 24px',
            background: activeTab === 'sales' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            color: '#FFF',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: activeTab === 'sales' ? '3px solid #FFF' : '3px solid transparent',
            transition: 'all 0.2s'
          }} onClick={() => setActiveTab('sales')}>
            <i className="fas fa-tag" style={{ width: '20px' }}></i>
            <span>Sales & Promotions</span>
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
                  }}>Welcome to Your Store, {user?.name}!</h1>
                  <p style={{
                    fontSize: 'var(--font-size-lg)',
                    margin: 0,
                    opacity: 0.95,
                    lineHeight: 1.6
                  }}>Track your sales performance, manage products, and monitor orders in real-time. Your store is growing every day!</p>
                </div>
                <div style={{
                  fontSize: '4rem',
                  opacity: 0.15,
                  marginLeft: 'var(--spacing-lg)'
                }}>
                  <i className="fas fa-store"></i>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid" style={{marginBottom: 'var(--spacing-2xl)'}}>
              <div className="metric-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <p className="metric-label">Total Sales</p>
                    <p className="metric-value">${stats.totalSales}</p>
                    <p className="metric-change positive">
                      <i className="fas fa-arrow-up"></i> +18%
                    </p>
                  </div>
                  <div style={{fontSize: '2.5rem', color: 'var(--primary-light)', opacity: 0.2}}>
                    <i className="fas fa-dollar-sign"></i>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <p className="metric-label">Active Products</p>
                    <p className="metric-value">{stats.activeProducts}</p>
                    <p className="metric-change positive">
                      <i className="fas fa-arrow-up"></i> +5%
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
                    <p className="metric-label">Pending Orders</p>
                    <p className="metric-value">{stats.pendingOrders}</p>
                    <p className="metric-change positive">
                      <i className="fas fa-arrow-up"></i> +2
                    </p>
                  </div>
                  <div style={{fontSize: '2.5rem', color: 'var(--warning-orange)', opacity: 0.2}}>
                    <i className="fas fa-clock"></i>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <p className="metric-label">Avg Rating</p>
                    <p className="metric-value">4.8★</p>
                    <p style={{fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', margin: 'var(--spacing-sm) 0 0 0'}}>
                      Based on {Math.floor(Math.random() * 100 + 50)} reviews
                    </p>
                  </div>
                  <div style={{fontSize: '2.5rem', color: 'var(--warning-orange)', opacity: 0.2}}>
                    <i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 'var(--spacing-lg)'}}>
              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{margin: 0}}>Quick Actions</h3>
                </div>
                <div className="card-body">
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)'}}>
                    <button className="btn btn-primary w-full" onClick={() => setActiveTab('products')}>
                      <i className="fas fa-plus"></i> Add Product
                    </button>
                    <button className="btn btn-secondary w-full" onClick={() => setActiveTab('manage-orders')}>
                      <i className="fas fa-eye"></i> View Orders
                    </button>
                    <button className="btn btn-secondary w-full" onClick={() => setActiveTab('sales')}>
                      <i className="fas fa-tag"></i> Sales & Promos
                    </button>
                    <button className="btn btn-secondary w-full" onClick={() => setActiveTab('analytics')}>
                      <i className="fas fa-chart-bar"></i> Analytics
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{margin: 0}}>Recent Orders</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('manage-orders')}>View All</button>
                </div>
                <div className="card-body">
                  {orders.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(order => (
                          <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td style={{fontWeight: 600}}>₱{parseFloat(order.total || 0).toFixed(2)}</td>
                            <td>
                              <span className={`badge badge-${order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'info'}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <p className="text-muted">No orders yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div style={{marginTop: 'var(--spacing-2xl)'}}>
              <div className="card">
                <div className="card-header">
                  <h3 style={{margin: 0}}>Your Top Products</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('products')}>View All</button>
                </div>
                <div className="card-body">
                  {products.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice(0, 8).map(product => (
                          <tr key={product.id}>
                            <td style={{fontWeight: 500}}>{product.name}</td>
                            <td style={{color: 'var(--success-green)', fontWeight: 600}}>${product.price}</td>
                            <td>{product.stock || 0} units</td>
                            <td>
                              <span className={`badge badge-${product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}`}>
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <p className="text-muted">No products yet. Create your first product!</p>
                      <button className="btn btn-primary mt-lg" onClick={() => setActiveTab('products')}>
                        Add Product
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="fade-in">
            <div style={{marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h2 style={{fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0}}>Your Products</h2>
                <p style={{color: 'var(--gray-600)', margin: 0}}>Manage your product catalog</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    name: '',
                    description: '',
                    brand: '',
                    type: '',
                    price: '',
                    gender: 'Men',
                    image: null,
                    imagePreview: null,
                    skus: []
                  });
                  setShowAddProductForm(true);
                }}
                style={{
                  background: '#111',
                  color: '#FFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '30px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="fas fa-plus"></i> Add New Product
              </button>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-lg)'}}>
              {products.map(product => (
                <div className="card" key={product.id}>
                  <div style={{
                    height: '200px',
                    background: '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderBottom: '1px solid #E5E5E5'
                  }}>
                    {product.image ? (
                      <img
                        src={`http://localhost:8000/storage/${product.image}`}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{textAlign: 'center', color: '#999'}}>
                        <i className="fas fa-image" style={{fontSize: '3rem', marginBottom: '8px'}}></i>
                        <p style={{margin: 0, fontSize: '14px'}}>No Image</p>
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <h4 style={{margin: '0 0 var(--spacing-sm) 0'}}>{product.name}</h4>
                    <p style={{color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', margin: '0 0 var(--spacing-md) 0'}}>{product.brand}</p>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)'}}>
                      <span style={{fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#FF6B00'}}>₱{parseFloat(product.price).toFixed(2)}</span>
                      <span className={`badge badge-${product.stock > 0 ? 'success' : 'danger'}`} style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: product.stock > 0 ? '#E8F5E9' : '#FFEBEE',
                        color: product.stock > 0 ? '#2E7D32' : '#C62828'
                      }}>
                        {product.stock} left
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          name: product.name,
                          description: product.description || '',
                          brand: product.brand || '',
                          type: product.type || '',
                          price: product.price,
                          gender: product.gender || 'Men',
                          image: null,
                          imagePreview: product.image ? `http://localhost:8000/storage/${product.image}` : null,
                          skus: product.skus || []
                        });
                        setShowAddProductForm(true);
                      }}
                      className="btn btn-secondary w-full btn-sm" 
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        background: '#F5F5F5',
                        border: '1px solid #DDD',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="fade-in">
            <div style={{marginBottom: 'var(--spacing-lg)'}}>
              <h2 style={{fontSize: 'var(--font-size-2xl)', fontWeight: 700}}>Sales Analytics</h2>
              <p style={{color: 'var(--gray-600)'}}>Track your sales performance and trends</p>
            </div>
            <div className="card">
              <div className="card-body" style={{textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--gray-500)'}}>
                <i className="fas fa-chart-line" style={{fontSize: '3rem', marginBottom: 'var(--spacing-lg)', opacity: 0.5}}></i>
                <p>Analytics charts coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="fade-in">
            <SalesManager products={products} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="fade-in">
            <div style={{marginBottom: 'var(--spacing-xl)'}}>
              <h2 style={{fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--gray-900)'}}>Store Settings</h2>
              <p style={{color: 'var(--gray-600)', fontSize: 'var(--font-size-base)'}}>Manage your store information and settings</p>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-lg)'}}>
              {/* Store Info Card */}
              <div className="card" style={{boxShadow: 'var(--shadow-md)'}}>
                <div className="card-header" style={{background: 'var(--gray-50)'}}>
                  <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <span style={{width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <i className="fas fa-store"></i>
                    </span>
                    Store Information
                  </h3>
                </div>
                <div className="card-body">
                  <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
                    <label style={{fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)'}}>Store Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={user?.name || ''} 
                      disabled 
                      style={{marginTop: 'var(--spacing-sm)'}}
                    />
                  </div>
                  <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
                    <label style={{fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)'}}>Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={user?.email || ''} 
                      disabled 
                      style={{marginTop: 'var(--spacing-sm)'}}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--gray-700)'}}>Store Status</label>
                    <div style={{marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-md)', background: '#e8f5e9', borderRadius: 'var(--radius-md)'}}>
                      <span className="badge badge-success" style={{background: 'var(--success-green)', color: 'white', padding: 'var(--spacing-xs) var(--spacing-md)', borderRadius: 'var(--radius-sm)'}}>Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status Card */}
              <div className="card" style={{boxShadow: 'var(--shadow-md)'}}>
                <div className="card-header" style={{background: 'var(--gray-50)'}}>
                  <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-lg)'}}>
                    <span style={{width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--info-cyan)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <i className="fas fa-shield-alt"></i>
                    </span>
                    Account Details
                  </h3>
                </div>
                <div className="card-body">
                  <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                    <div style={{padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary-blue)'}}>
                      <div style={{fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)', fontWeight: 500}}>Role</div>
                      <div style={{fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--gray-900)', marginTop: 'var(--spacing-xs)'}}>
                        <i className="fas fa-store" style={{marginRight: 'var(--spacing-sm)', color: 'var(--primary-blue)'}}></i>
                        Seller
                      </div>
                    </div>
                    <div style={{padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--success-green)'}}>
                      <div style={{fontSize: 'var(--font-size-xs)', color: 'var(--gray-600)', fontWeight: 500}}>Member Since</div>
                      <div style={{fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--gray-900)', marginTop: 'var(--spacing-xs)'}}>
                        {user ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddProductForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #E5E5E5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#FFFFFF',
              zIndex: 10
            }}>
              <h2 style={{margin: 0, fontSize: '24px', fontWeight: '700', color: '#111'}}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowAddProductForm(false);
                  setEditingProduct(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddProduct} style={{padding: '24px'}}>
              {/* Product Name */}
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111',
                  marginBottom: '8px'
                }}>
                  Product Name <span style={{color: '#F44336'}}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #DDD',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Brand */}
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111',
                  marginBottom: '8px'
                }}>
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g., Nike, Adidas"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #DDD',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111',
                  marginBottom: '8px'
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product description"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #DDD',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Type */}
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111',
                  marginBottom: '8px'
                }}>
                  Shoe Type
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Basketball, Running, Casual"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #DDD',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Price */}
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111',
                  marginBottom: '8px'
                }}>
                  Price (₱) <span style={{color: '#F44336'}}>*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #DDD',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>



              {/* Category */}
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111',
                  marginBottom: '8px'
                }}>
                  Category <span style={{color: '#F44336'}}>*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #DDD',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>

              {/* SKU Management */}
              <div style={{marginBottom: '20px', padding: '16px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #E5E5E5'}}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#111',
                  textTransform: 'uppercase'
                }}>
                  Add Size & Color Options
                </h3>

                {/* SKU Form */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px'}}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#111',
                      marginBottom: '4px'
                    }}>
                      Size
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={newSku.size}
                      onChange={handleSkuInputChange}
                      placeholder="e.g., 5, 5.5, 6"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #DDD',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#111',
                      marginBottom: '4px'
                    }}>
                      Color/Colorway
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={newSku.color}
                      onChange={handleSkuInputChange}
                      placeholder="e.g., Black, Red/Black"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #DDD',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#111',
                      marginBottom: '4px'
                    }}>
                      Width (Optional)
                    </label>
                    <input
                      type="text"
                      name="width"
                      value={newSku.width}
                      onChange={handleSkuInputChange}
                      placeholder="e.g., Standard, Wide"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #DDD',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#111',
                      marginBottom: '4px'
                    }}>
                      Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={newSku.stock}
                      onChange={handleSkuInputChange}
                      placeholder="0"
                      min="0"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #DDD',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddSku}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: '#f0f0f0',
                    border: '1px solid #DDD',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    color: '#111',
                    textTransform: 'uppercase',
                    transition: 'none'
                  }}
                >
                  + Add SKU Option
                </button>

                {/* SKU List */}
                {formData.skus.length > 0 && (
                  <div style={{marginTop: '16px'}}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                      textTransform: 'uppercase'
                    }}>
                      Added SKUs ({formData.skus.length})
                    </h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      {formData.skus.map((sku, index) => (
                        <div key={index} style={{
                          padding: '10px 12px',
                          background: '#FFFFFF',
                          border: '1px solid #E5E5E5',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px'
                        }}>
                          <span style={{fontWeight: '500', color: '#111'}}>
                            {sku.size} • {sku.color} {sku.width ? `• ${sku.width}` : ''} • Stock: {sku.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSku(index)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#F44336',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: 0
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111',
                  marginBottom: '8px'
                }}>
                  Product Image {!editingProduct && <span style={{color: '#F44336'}}>*</span>}
                  {editingProduct && <span style={{fontSize: '12px', fontWeight: '400', color: '#666'}}> (Click image to update)</span>}
                </label>
                <div style={{
                  border: '2px dashed #DDD',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#FAFAFA',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#111';
                  e.currentTarget.style.background = '#F5F5F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#DDD';
                  e.currentTarget.style.background = '#FAFAFA';
                }}
                onClick={() => document.getElementById('imageInput').click()}
                >
                  {formData.imagePreview ? (
                    <div>
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          marginBottom: '12px',
                          borderRadius: '8px'
                        }}
                      />
                      <p style={{margin: 0, fontSize: '14px', color: '#111', fontWeight: '600'}}>
                        <i className="fas fa-camera"></i> Click to {editingProduct ? 'change' : 'replace'} image
                      </p>
                      <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#999'}}>
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <i className="fas fa-cloud-upload-alt" style={{fontSize: '32px', color: '#999', marginBottom: '12px', display: 'block'}}></i>
                      <p style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#111'}}>
                        Click to upload product image
                      </p>
                      <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#999'}}>
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{display: 'none'}}
                />
              </div>

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '20px',
                borderTop: '1px solid #E5E5E5'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductForm(false);
                    setEditingProduct(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#F5F5F5',
                    border: '1px solid #DDD',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#111',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E8E8E8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F5F5F5'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: loading ? '#CCC' : '#111',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    color: '#FFF',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
                >
                  {loading 
                    ? (editingProduct ? 'Updating...' : 'Adding...') 
                    : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
