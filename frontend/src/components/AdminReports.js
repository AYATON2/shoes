import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const AdminReports = () => {
  const [inventoryReport, setInventoryReport] = useState([]);
  const [salesReport, setSalesReport] = useState([]);
  const [orderStatusReport, setOrderStatusReport] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    topBrands: [],
  });
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .all([
        axios.get('/api/users'),
        axios.get('/api/products'),
        axios.get('/api/orders'),
        axios.get('/api/reports/inventory'),
      ])
      .then(
        axios.spread((usersRes, productsRes, ordersRes, inventoryRes) => {
          const orders = ordersRes.data?.data || [];
          const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
          const inventoryTopBrands = inventoryRes.data?.top_brands || [];

          setAnalytics({
            totalUsers: usersRes.data?.length || 0,
            totalProducts: productsRes.data?.data?.length || 0,
            totalOrders: orders.length,
            totalRevenue: revenue,
            topBrands: inventoryTopBrands,
          });
        })
      )
      .catch((err) => {
        console.error('Failed to load analytics snapshot:', err);
      });
  }, [navigate]);

  const orderStatusChartData = {
    labels: orderStatusReport.map((item) => item.status),
    datasets: [
      {
        label: 'Orders',
        data: orderStatusReport.map((item) => item.count),
        backgroundColor: ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#06B6D4', '#6B7280'],
      },
    ],
  };

  const topBrandsChartData = {
    labels: analytics.topBrands.map((item) => item.brand || 'Unknown'),
    datasets: [
      {
        label: 'Product Count',
        data: analytics.topBrands.map((item) => item.count),
        backgroundColor: '#2563EB',
      },
    ],
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

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reports</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Total Users</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700 }}>{analytics.totalUsers}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Total Products</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700 }}>{analytics.totalProducts}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Total Orders</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700 }}>{analytics.totalOrders}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Total Revenue</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 700 }}>${analytics.totalRevenue.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6 mb-3">
          <div className="card h-100">
            <div className="card-header">
              <strong>Order Status Analytics</strong>
            </div>
            <div className="card-body" style={{ minHeight: '320px' }}>
              {orderStatusReport.length > 0 ? (
                <Doughnut data={orderStatusChartData} />
              ) : (
                <p className="text-muted mb-0">Generate order status report to view chart.</p>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6 mb-3">
          <div className="card h-100">
            <div className="card-header">
              <strong>Top Brands Analytics</strong>
            </div>
            <div className="card-body" style={{ minHeight: '320px' }}>
              {analytics.topBrands.length > 0 ? (
                <Bar
                  data={topBrandsChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                  }}
                />
              ) : (
                <p className="text-muted mb-0">No brand analytics available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header gradient-bg text-white">
              <h2 className="section-title mb-0">Inventory Report</h2>
            </div>
            <div className="card-body">
              <button className="btn btn-warning btn-block mb-3" onClick={fetchInventory}>Generate Report</button>
              {inventoryReport?.top_sizes?.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-modern table-sm">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryReport.top_sizes.map(item => (
                        <tr key={item.size}>
                          <td>{item.size}</td>
                          <td>{item.total_stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header gradient-bg text-white">
              <h2 className="section-title mb-0">Sales Report</h2>
            </div>
            <div className="card-body">
              <button className="btn btn-info btn-block mb-3" onClick={fetchSales}>Generate Report</button>
              {salesReport.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-modern table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Revenue</th>
                        <th>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.map(item => (
                        <tr key={item.date}>
                          <td>{item.date}</td>
                          <td>${parseFloat(item.revenue || 0).toFixed(2)}</td>
                          <td>{item.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header gradient-bg text-white">
              <h2 className="section-title mb-0">Order Status Report</h2>
            </div>
            <div className="card-body">
              <button className="btn btn-secondary btn-block mb-3" onClick={fetchOrderStatus}>Generate Report</button>
              {orderStatusReport.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-modern table-sm">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderStatusReport.map(item => (
                        <tr key={item.status}>
                          <td>{item.status}</td>
                          <td>{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;