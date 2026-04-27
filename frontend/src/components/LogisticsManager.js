import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ACCENT = '#111111';

const LogisticsManager = () => {
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', base_cost: '', is_local: false });
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchLogistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLogistics = () => {
    setLoading(true);
    axios.get('/api/logistics').then(res => {
      setLogistics(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch logistics:', err);
      setLoading(false);
      showToast('Failed to load logistics', 'error');
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = editingId ? axios.put(`/api/logistics/${editingId}`, formData) : axios.post('/api/logistics', formData);
    
    action.then(() => {
      showToast(editingId ? 'Courier updated!' : 'Courier added!');
      fetchLogistics();
      resetForm();
    }).catch(err => {
      console.error(err);
      showToast('Failed to save courier', 'error');
    });
  };

  const editLogistics = (item) => {
    setEditingId(item.id);
    setFormData({ name: item.name, base_cost: item.base_cost, is_local: item.is_local });
    window.scrollTo(0, 0);
  };

  const deleteLogistics = (id) => {
    if (window.confirm('Are you sure you want to delete this courier?')) {
      axios.delete(`/api/logistics/${id}`).then(() => {
        showToast('Courier deleted');
        fetchLogistics();
      }).catch(err => showToast('Delete failed', 'error'));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', base_cost: '', is_local: false });
    setEditingId(null);
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 };

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#fee2e2' : '#dcfce7', color: toast.type === 'error' ? '#dc2626' : '#15803d', border: `1.5px solid ${toast.type === 'error' ? '#fca5a5' : '#86efac'}`, borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          <i className={`fas ${toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'}`} style={{ marginRight: 8 }} />
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Logistics Management</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Configure shipping methods, couriers, and delivery costs.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Table Section */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Available Couriers</h3>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{logistics.length} active methods</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Courier Name', 'Base Cost', 'Type', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading...</td></tr>
                ) : logistics.map(item => (
                  <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#10b981' }}>₱{parseFloat(item.base_cost).toFixed(2)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        background: item.is_local ? '#e0f2fe' : '#fef3c7',
                        color: item.is_local ? '#0369a1' : '#b45309',
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
                      }}>
                        {item.is_local ? 'Local Delivery' : 'National Courier'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => editLogistics(item)} style={{ padding: '6px 12px', border: `1.5px solid ${ACCENT}`, borderRadius: 7, background: 'transparent', color: ACCENT, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                          Edit
                        </button>
                        <button onClick={() => deleteLogistics(item.id)} style={{ padding: '6px 12px', border: '1.5px solid #fca5a5', borderRadius: 7, background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && logistics.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No logistics options configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Section */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', padding: 24, height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {editingId ? 'Edit Courier' : 'Add New Courier'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Courier Name *</label>
              <input 
                type="text" name="name" style={inputStyle}
                value={formData.name} onChange={handleInputChange} 
                required placeholder="e.g. J&T Express, LBC"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Base Cost (₱) *</label>
              <input 
                type="number" step="0.01" name="base_cost" style={inputStyle}
                value={formData.base_cost} onChange={handleInputChange} required 
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 10 }}>
                <input 
                  type="checkbox" name="is_local" 
                  checked={formData.is_local} onChange={handleInputChange}
                  style={{ width: 18, height: 18, accentColor: ACCENT, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>Local Delivery (Butuan/Agusan)</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 10, background: ACCENT, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                {editingId ? 'Update' : 'Add'} Courier
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogisticsManager;
