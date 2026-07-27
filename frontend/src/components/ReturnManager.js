import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buildStorageUrl } from '../utils/apiUrl';

const ReturnManager = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = () => {
    setLoading(true);
    axios.get('/api/returns').then(res => {
      setReturns(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch returns:', err);
      setLoading(false);
    });
  };

  const updateStatus = (id, newStatus) => {
    axios.patch(`/api/returns/${id}/status`, { status: newStatus }).then(() => {
      fetchReturns();
    }).catch(err => console.error(err));
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'completed': return 'primary';
      default: return 'warning'; // pending
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Return Requests</h2>
        <p style={{ color: 'var(--gray-600)' }}>Manage and process customer return requests</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>All Return Requests</h3>
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
                    <th>Customer</th>
                    <th>Reason</th>
                    <th>Proof</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(ret => (
                    <tr key={ret.id}>
                      <td style={{ fontWeight: 500 }}>#{ret.order_id}</td>
                      <td>{ret.user?.name || 'Unknown User'}</td>
                      <td style={{ maxWidth: '250px' }}>{ret.reason}</td>
                      <td>
                        {ret.proof_image ? (
                          <a href={buildStorageUrl(ret.proof_image)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
                            <i className="fas fa-image" style={{ marginRight: '4px' }}></i> View
                          </a>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusBadgeClass(ret.status)}`}>
                          {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {ret.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-sm btn-success" onClick={() => updateStatus(ret.id, 'approved')}>
                              Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => updateStatus(ret.id, 'rejected')}>
                              Reject
                            </button>
                          </div>
                        )}
                        {ret.status === 'approved' && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateStatus(ret.id, 'completed')}>
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {returns.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>No return requests found.</td>
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

export default ReturnManager;
