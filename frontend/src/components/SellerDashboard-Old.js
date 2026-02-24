import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState({});
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', brand: '', type: '', material: '', performance_tech: '', release_date: '', gender: '', age_group: '', price: '', stock: ''
  });
  const [skus, setSkus] = useState([{ size: 'M', color: 'Black', width: 'Medium', stock: '10' }]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.get('/api/user').then(res => setUser(res.data));
    axios.get('/api/products').then(res => setProducts(res.data.data));
    axios.get('/api/orders').then(res => setOrders(res.data.data));
    axios.get('/api/reports/seller-sales').then(res => setSales(res.data));
  }, [navigate]);

  const addProduct = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProduct).forEach(key => {
      if (key === 'image' && newProduct[key]) {
        formData.append(key, newProduct[key]);
      } else if (newProduct[key]) {
        formData.append(key, newProduct[key]);
      }
    });
    formData.append('skus', JSON.stringify(skus));
    console.log('Sending product data:', formData);
    axios.post('/api/products', formData, { headers: {'Content-Type': 'multipart/form-data'} }).then(res => {
      setProducts([...products, res.data]);
      setNewProduct({ name: '', description: '', brand: '', type: '', material: '', performance_tech: '', release_date: '', gender: '', age_group: '', price: '', stock: '', image: null });
      setSkus([{ size: '', color: '', width: '', stock: '' }]);
      alert('Product added successfully!');
    }).catch(err => {
      console.log(err.response?.data);
      alert('Failed to add product: ' + (err.response?.data?.message || 'Unknown error'));
    });
  };

  const addSku = () => {
    setSkus([...skus, { size: 'M', color: 'Black', width: 'Medium', stock: '10' }]);
  };

  const updateStatus = (orderId, status) => {
    axios.put(`/api/orders/${orderId}`, { status }).then(res => {
      setOrders(orders.map(o => o.id === orderId ? res.data : o));
    });
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    axios.put('/api/user', { name: user.name, email: user.email }).then(res => {
      setUser(res.data);
      alert('Profile updated successfully');
    }).catch(err => alert('Update failed'));
  };

  const handleLogout = () => {
    axios.post('/api/logout').then(() => {
      localStorage.removeItem('token');
      window.location.href = '/';
    });
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data for charts (replace with real data from API)
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sales ($)',
      data: [1200, 1900, 3000, 5000, 2000, 3000],
      backgroundColor: 'rgba(52, 152, 219, 0.6)',
      borderColor: 'rgba(52, 152, 219, 1)',
      borderWidth: 1,
    }],
  };

  const ordersData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Orders',
      data: [12, 19, 30, 50, 20, 30],
      borderColor: 'rgba(155, 89, 182, 1)',
      backgroundColor: 'rgba(155, 89, 182, 0.2)',
      tension: 0.1,
    }],
  };

  if (!user) return <div className="d-flex justify-content-center"><div className="spinner-border" role="status"><span className="sr-only">Loading...</span></div></div>;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <i className="fas fa-store text-primary"></i>
            <h3 className="text-gradient mb-0">Seller Panel</h3>
          </div>
          <div className="sidebar-actions">
            <button className="btn btn-sm btn-outline-light" onClick={handleLogout} title="Logout">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <i className="fas fa-box"></i>
            <span>Products</span>
          </button>
          <button className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <i className="fas fa-shopping-cart"></i>
            <span>Orders</span>
          </button>
          <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <i className="fas fa-chart-line"></i>
            <span>Analytics</span>
          </button>
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h1>Welcome back, {user.name}!</h1>
          <p>Manage your products and track your sales performance.</p>
        </div>

        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <div className="stats-row">
              <div className="stat-card">
                <h3>${sales.total_revenue || 0}</h3>
                <p>Total Revenue</p>
                <i className="fas fa-dollar-sign icon"></i>
              </div>
              <div className="stat-card">
                <h3>{sales.total_items || 0}</h3>
                <p>Items Sold</p>
                <i className="fas fa-shopping-bag icon"></i>
              </div>
              <div className="stat-card">
                <h3>{products.length}</h3>
                <p>My Products</p>
                <i className="fas fa-box icon"></i>
              </div>
              <div className="stat-card">
                <h3>{orders.length}</h3>
                <p>Total Orders</p>
                <i className="fas fa-clipboard-list icon"></i>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <h4>Sales Overview</h4>
                <Bar data={salesData} />
              </div>
              <div className="chart-card">
                <h4>Orders Trend</h4>
                <Line data={ordersData} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="products-content">
            <div className="content-section">
              <h2>My Products</h2>
              <div className="table-responsive">
                <table className="table table-modern">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Brand</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.brand}</td>
                        <td>${product.price}</td>
                        <td>{product.skus?.reduce((sum, sku) => sum + sku.stock, 0) || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="content-section">
              <button className="btn btn-primary" data-bs-toggle="collapse" data-bs-target="#addProductForm">Add New Product</button>
              <div className="collapse mt-3" id="addProductForm">
                <form onSubmit={addProduct}>
                  <div className="form-row">
                    <div className="col-md-6">
                      <input type="text" name="name" autoComplete="name" className="form-control mb-3" placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <input type="text" name="brand" autoComplete="organization" className="form-control mb-3" placeholder="Brand" value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} required />
                    </div>
                  </div>
                  <textarea name="description" className="form-control mb-3" placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} required></textarea>
                  <div className="form-row">
                    <div className="col-md-4">
                      <input type="text" name="type" className="form-control mb-3" placeholder="Type" value={newProduct.type} onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })} required />
                    </div>
                    <div className="col-md-4">
                      <input type="text" name="material" className="form-control mb-3" placeholder="Material" value={newProduct.material} onChange={(e) => setNewProduct({ ...newProduct, material: e.target.value })} required />
                    </div>
                    <div className="col-md-4">
                      <input type="text" name="performance_tech" className="form-control mb-3" placeholder="Performance Tech" value={newProduct.performance_tech} onChange={(e) => setNewProduct({ ...newProduct, performance_tech: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="col-md-3">
                    <input type="date" name="release_date" className="form-control mb-3" value={newProduct.release_date} onChange={(e) => setNewProduct({ ...newProduct, release_date: e.target.value })} />
                    </div>
                    <div className="col-md-3">
                    <select name="gender" className="form-control mb-3" value={newProduct.gender} onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}>
                        <option value="">Select Gender</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                    <select name="age_group" className="form-control mb-3" value={newProduct.age_group} onChange={(e) => setNewProduct({ ...newProduct, age_group: e.target.value })}>
                        <option value="">Select Age Group</option>
                        <option value="adult">Adult</option>
                        <option value="kids">Kids</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                    <input type="number" name="price" className="form-control mb-3" placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="col-md-12">
                      <input type="file" name="image" className="form-control mb-3" accept="image/*" onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files[0] })} />
                    </div>
                  </div>
                  <h5>SKUs</h5>
                  {skus.map((sku, index) => (
                    <div key={index} className="form-row mb-2">
                      <div className="col">
                        <input type="text" name={`skus[${index}].size`} className="form-control" placeholder="Size" value={sku.size} onChange={(e) => {
                          const newSkus = [...skus];
                          newSkus[index].size = e.target.value;
                          setSkus(newSkus);
                        }} required />
                      </div>
                      <div className="col">
                        <input type="text" name={`skus[${index}].color`} className="form-control" placeholder="Color" value={sku.color} onChange={(e) => {
                          const newSkus = [...skus];
                          newSkus[index].color = e.target.value;
                          setSkus(newSkus);
                        }} required />
                      </div>
                      <div className="col">
                        <input type="text" name={`skus[${index}].width`} className="form-control" placeholder="Width" value={sku.width} onChange={(e) => {
                          const newSkus = [...skus];
                          newSkus[index].width = e.target.value;
                          setSkus(newSkus);
                        }} required />
                      </div>
                      <div className="col">
                        <input type="number" name={`skus[${index}].stock`} className="form-control" placeholder="Stock" value={sku.stock} onChange={(e) => {
                          const newSkus = [...skus];
                          newSkus[index].stock = e.target.value;
                          setSkus(newSkus);
                        }} required />
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary mr-2" onClick={addSku}>Add SKU</button>
                  <button type="submit" className="btn btn-primary">Add Product</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-content">
            <h2>Recent Orders</h2>
            <div className="table-responsive">
              <table className="table table-modern">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.user?.name}</td>
                      <td>{order.status}</td>
                      <td>
                        <select className="form-control form-control-sm" defaultValue={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-content">
            <h2>Analytics</h2>
            <div className="charts-row">
              <div className="chart-card">
                <h4>Detailed Sales</h4>
                <Bar data={salesData} />
              </div>
              <div className="chart-card">
                <h4>Order Growth</h4>
                <Line data={ordersData} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-content">
            <h2>Profile Management</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" className="form-control" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary">Update Profile</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;