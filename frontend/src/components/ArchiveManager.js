import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ArchiveManager = () => {
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArchivedOrders();
  }, []);

  const fetchArchivedOrders = () => {
    setLoading(true);
    // Fetch orders with archived=true query parameter
    axios.get('/api/orders?archived=true').then(res => {
      setArchivedOrders(res.data.data || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch archived orders:', err);
      setLoading(false);
    });
  };

  const unarchiveOrder = (id) => {
    axios.patch(`/api/orders/${id}/archive`).then(() => {
      fetchArchivedOrders();
    }).catch(err => {
      console.error('Failed to unarchive order:', err);
      alert(err.response?.data?.message || 'Failed to unarchive order. Please try again.');
    });
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Archive Management</h2>
        <p style={{ color: 'var(--gray-600)' }}>View and restore archived orders</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Archived Orders</h3>
          <button className="btn btn-ghost btn-sm" onClick={fetchArchivedOrders}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>Loading...</div>
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedOrders.map(order => (
                    <tr key={order.id} style={{ opacity: 0.8 }}>
                      <td style={{ fontWeight: 500 }}>#{order.id}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>{order.user?.name || 'Unknown User'}</td>
                      <td>₱{parseFloat(order.total).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-secondary">{order.status}</span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => unarchiveOrder(order.id)}>
                          <i className="fas fa-box-open" style={{ marginRight: '4px' }}></i> Unarchive
                        </button>
                      </td>
                    </tr>
                  ))}
                  {archivedOrders.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-500)' }}>
                        <i className="fas fa-folder-open" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px', opacity: 0.5 }}></i>
                        No archived orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveManager;
