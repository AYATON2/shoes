
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const EMPTY_USER = { name: '', email: '', password: '', role: 'staff', logistic_id: '' };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = () => {
    axios.get('/api/users').then(res => {
      // Filter out only current user or sensitve roles if needed, but here we show all except admin
      setUsers(res.data.filter(u => u.role !== 'admin'));
    }).catch(err => {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        console.error('Failed to fetch users:', err);
        showToast('Failed to load users', 'error');
      }
    });
    axios.get('/api/logistics').then(res => setLogistics(res.data)).catch(err => {
      console.error('Failed to fetch logistics:', err);
      showToast('Failed to load couriers', 'error');
    });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleActive = (userId, active) => {
    const endpoint = active ? `/api/users/${userId}/activate` : `/api/users/${userId}/deactivate`;
    axios.patch(endpoint).then(() => fetchData()).catch(err => {
      console.error('Failed to update user status:', err);
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    });
  };

  const updateRole = (userId, role) => {
    axios.put(`/api/users/${userId}`, { role }).then(() => fetchData()).catch(err => {
      console.error('Failed to update user role:', err);
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    });
  };

  const updateLogistic = (userId, logistic_id) => {
    axios.put(`/api/users/${userId}`, { logistic_id: logistic_id || null }).then(() => fetchData()).catch(err => {
      console.error('Failed to update user courier:', err);
      showToast(err.response?.data?.message || 'Failed to update courier', 'error');
    });
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    setLoading(true);
    axios.post('/api/users', newUser).then(() => {
      showToast('Account created successfully');
      setNewUser(EMPTY_USER);
      setShowAddModal(false);
      fetchData();
    }).catch(err => {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors)[0][0] : 'Failed to create user';
      showToast(msg, 'error');
    }).finally(() => setLoading(false));
  };

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                       u.email.toLowerCase().includes(search.toLowerCase()) ||
                       (u.customer_number && u.customer_number.toLowerCase().includes(search.toLowerCase()));
    return matchRole && matchSearch;
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", animation: 'fadeIn 0.3s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .user-card:hover { border-color: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000, background: toast.type === 'error' ? '#FFEBEE' : '#E8F5E9', color: toast.type === 'error' ? '#C62828' : '#2E7D32', padding: '16px 24px', borderRadius: '12px', fontWeight: '600', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>User & Staff Management</h1>
          <p style={{ color: '#666', margin: '8px 0 0' }}>Manage permissions, roles, and logistics assignments.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ background: '#111', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-plus" /> Create New Account
        </button>
      </div>

      <div style={{ background: '#FFF', borderRadius: '24px', border: '1px solid #EEE', overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ padding: '24px', borderBottom: '1px solid #EEE', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input 
              type="text" placeholder="Search by name, email or customer ID..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid #E5E5E5', background: '#FAFAFA' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', background: '#F5F5F5', padding: '4px', borderRadius: '12px' }}>
             {['all', 'staff', 'rider', 'customer'].map(r => (
               <button key={r} onClick={() => setFilterRole(r)} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: filterRole === r ? '#FFF' : 'transparent', color: filterRole === r ? '#111' : '#666', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: filterRole === r ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                 {r.charAt(0).toUpperCase() + r.slice(1)}
               </button>
             ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EEE' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>User / ID</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Logistics Access</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#111' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>{u.customer_number || u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <select 
                    value={u.role} onChange={e => updateRole(u.id, e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #E5E5E5', fontSize: '13px', fontWeight: '600' }}>
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="rider">Rider</option>
                  </select>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  {u.role === 'staff' ? (
                    <select 
                      value={u.logistic_id || ''} onChange={e => updateLogistic(u.id, e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #E5E5E5', fontSize: '13px' }}>
                      <option value="">No Access</option>
                      {logistics.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  ) : <span style={{ color: '#DDD' }}>—</span>}
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <span style={{ 
                     padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                     background: u.active ? '#E8F5E9' : '#F5F5F5',
                     color: u.active ? '#2E7D32' : '#999'
                   }}>{u.active ? 'ACTIVE' : 'INACTIVE'}</span>
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                  <button onClick={() => toggleActive(u.id, !u.active)} style={{ border: 'none', background: 'none', color: u.active ? '#C62828' : '#2E7D32', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div style={{ background: '#FFF', padding: '28px', borderRadius: '24px', maxWidth: '480px', width: '100%', animation: 'fadeIn 0.3s ease', margin: '0 16px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Create New Account</h2>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: '#F5F5F5', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddUser} style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Full Name</label>
                  <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. John Doe" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5E5', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@example.com" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5E5', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Password</label>
                <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Min. 8 characters" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5E5', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>System Role</label>
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value, logistic_id: ''})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5E5', background: '#FFF' }}>
                    <option value="staff">Staff</option>
                    <option value="rider">Rider</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Logistics Access (Staff Only)</label>
                  <select 
                    value={newUser.logistic_id} 
                    onChange={e => setNewUser({...newUser, logistic_id: e.target.value})} 
                    disabled={newUser.role !== 'staff'}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5E5', background: newUser.role !== 'staff' ? '#F9F9F9' : '#FFF', color: newUser.role !== 'staff' ? '#999' : '#111' }}>
                    <option value="">No Access</option>
                    {logistics.length === 0 && newUser.role === 'staff' ? (
                      <option disabled>Loading...</option>
                    ) : (
                      logistics.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                    )}
                  </select>
                  {newUser.role === 'staff' && logistics.length > 0 && (
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Staff will only see orders for their assigned courier.</p>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '40px', border: 'none', background: '#111', color: '#FFF', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;