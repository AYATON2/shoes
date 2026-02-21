import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    axios.get('/api/users').then(res => setUsers(res.data)).catch(err => {
      console.error('Failed to fetch users:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    });
  }, [navigate]);

  const toggleActive = (userId, active) => {
    const endpoint = active ? `/api/users/${userId}/activate` : `/api/users/${userId}/deactivate`;
    axios.patch(endpoint).then(res => {
      setUsers(users.map(u => u.id === userId ? res.data : u));
    }).catch(err => console.error('Failed to toggle user status:', err));
  };

  const updateRole = (userId, role) => {
    axios.put(`/api/users/${userId}`, { role }).then(res => {
      setUsers(users.map(u => u.id === userId ? res.data : u));
    }).catch(err => console.error('Failed to update user role:', err));
  };

  const approveSeller = (userId) => {
    axios.patch(`/api/users/${userId}/approve`).then(res => {
      setUsers(users.map(u => u.id === userId ? res.data : u));
    }).catch(err => console.error('Failed to approve seller:', err));
  };

  const suspendSeller = (userId) => {
    axios.patch(`/api/users/${userId}/suspend`).then(res => {
      setUsers(users.map(u => u.id === userId ? res.data : u));
    }).catch(err => console.error('Failed to suspend seller:', err));
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Management</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-modern table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.active ? 'Active' : 'Inactive'}</td>
                <td>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <button className="btn btn-sm btn-warning" onClick={() => toggleActive(u.id, !u.active)}>{u.active ? 'Deactivate' : 'Activate'}</button>
                    {u.role === 'seller' && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => approveSeller(u.id)} disabled={u.approved}>Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => suspendSeller(u.id)} disabled={!u.approved}>Suspend</button>
                      </>
                    )}
                    <select className="form-control form-control-sm" defaultValue={u.role} onChange={(e) => updateRole(u.id, e.target.value)}>
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;