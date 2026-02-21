import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });

  useEffect(() => {
    axios.get('/api/user').then(res => {
      setUser(res.data);
      setForm({ name: res.data.name, email: res.data.email, password: '', password_confirmation: '' });
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put('/api/user', form).then(res => {
      setUser(res.data);
      setForm({ ...form, password: '', password_confirmation: '' });
      alert('Profile updated');
    }).catch(err => alert('Update failed'));
  };

  if (!user) return <div className="d-flex justify-content-center"><div className="spinner-border" role="status"><span className="sr-only">Loading...</span></div></div>;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header gradient-bg text-white text-center">
              <h1 className="card-title mb-0">Profile</h1>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>New Password (leave blank to keep current)</label>
                  <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" className="form-control" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" className="form-control" value={user.role} readOnly />
                </div>
                <button type="submit" className="btn btn-primary btn-block">Update Profile</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;