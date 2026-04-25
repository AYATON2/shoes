import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RiderManager = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: 'Butuan'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = () => {
    setLoading(true);
    axios.get('/api/riders').then(res => {
      setRiders(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch riders:', err);
      setLoading(false);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    axios.post('/api/riders', formData).then(() => {
      fetchRiders();
      setFormData({ name: '', email: '', password: '', city: 'Butuan' });
    }).catch(err => {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create rider');
    });
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Rider Management</h2>
        <p style={{ color: 'var(--gray-600)' }}>Manage local delivery riders</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 'var(--spacing-lg)' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Registered Riders</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>Loading...</div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>City/Coverage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map(rider => (
                    <tr key={rider.id}>
                      <td style={{ fontWeight: 500 }}>{rider.name}</td>
                      <td>{rider.email}</td>
                      <td>{rider.city}</td>
                      <td>
                        <span className={`badge badge-${rider.active ? 'success' : 'danger'}`}>
                          {rider.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {riders.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>No riders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Create New Rider</h3>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger" style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '15px', borderRadius: '4px' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 500, display: 'block', marginBottom: '8px' }}>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 500, display: 'block', marginBottom: '8px' }}>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-control" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="rider@example.com"
                />
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 500, display: 'block', marginBottom: '8px' }}>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  className="form-control" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required 
                  minLength="8"
                />
              </div>
              <div className="form-group mb-4">
                <label style={{ fontWeight: 500, display: 'block', marginBottom: '8px' }}>Coverage City</label>
                <select 
                  name="city" 
                  className="form-control" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="Butuan">Butuan City</option>
                  <option value="Agusan">Agusan</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Create Rider Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderManager;
