import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminReports = () => {
  const [inventoryReport, setInventoryReport] = useState([]);
  const [salesReport, setSalesReport] = useState([]);
  const [orderStatusReport, setOrderStatusReport] = useState([]);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

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
        <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>
      <div className="row">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header gradient-bg text-white">
              <h2 className="section-title mb-0">Inventory Report</h2>
            </div>
            <div className="card-body">
              <button className="btn btn-warning btn-block mb-3" onClick={fetchInventory}>Generate Report</button>
              {inventoryReport.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-modern table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryReport.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.stock}</td>
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
                        <th>Product ID</th>
                        <th>Total Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.map(item => (
                        <tr key={item.id}>
                          <td>{item.product_id}</td>
                          <td>{item.total_sales}</td>
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
                        <th>Order ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderStatusReport.map(item => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.status}</td>
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