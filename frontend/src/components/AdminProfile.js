import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
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
    axios.get('/api/user').then(res => setUser(res.data)).catch(err => {
      console.error('Failed to fetch user:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email, password: '', password_confirmation: '' });
    }
  }, [user]);

  const updateProfile = (e) => {
    e.preventDefault();
    axios.put('/api/user', profileForm).then(res => {
      setUser(res.data);
      alert('Profile updated successfully!');
    }).catch(err => {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile: ' + (err.response?.data?.message || 'Unknown error'));
    });
  };

  if (!user) return <div className="d-flex justify-content-center"><div className="spinner-border" role="status"><span className="sr-only">Loading...</span></div></div>;

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <button className="btn btn-back" onClick={() => navigate('/admin-dashboard')}>
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
          <div className="header-title">
            <h1>
              <i className="fas fa-user-circle"></i>
              Profile Settings
            </h1>
            <p>Manage your account information and security settings</p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-grid">
          {/* Profile Information Card */}
          <div className="profile-card main-profile">
            <div className="card-header-modern">
              <div className="card-icon">
                <i className="fas fa-id-card"></i>
              </div>
              <h3>Personal Information</h3>
            </div>
            <div className="card-body-modern">
              <form onSubmit={updateProfile} className="profile-form">
                <div className="form-section">
                  <h4>Basic Details</h4>
                  <div className="form-row">
                    <div className="form-group-modern">
                      <label>
                        <i className="fas fa-user"></i>
                        Full Name
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          className="form-control-modern"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="Enter your full name"
                          required
                        />
                        <div className="input-icon">
                          <i className="fas fa-check-circle"></i>
                        </div>
                      </div>
                    </div>

                    <div className="form-group-modern">
                      <label>
                        <i className="fas fa-envelope"></i>
                        Email Address
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="email"
                          className="form-control-modern"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          placeholder="Enter your email"
                          required
                        />
                        <div className="input-icon">
                          <i className="fas fa-at"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Security Settings</h4>
                  <div className="form-row">
                    <div className="form-group-modern">
                      <label>
                        <i className="fas fa-lock"></i>
                        New Password
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="password"
                          className="form-control-modern"
                          value={profileForm.password}
                          onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                          placeholder="Leave blank to keep current"
                        />
                        <div className="input-icon">
                          <i className="fas fa-key"></i>
                        </div>
                      </div>
                      <small className="form-hint">Minimum 8 characters with numbers and symbols</small>
                    </div>

                    <div className="form-group-modern">
                      <label>
                        <i className="fas fa-shield-alt"></i>
                        Confirm Password
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="password"
                          className="form-control-modern"
                          value={profileForm.password_confirmation}
                          onChange={(e) => setProfileForm({ ...profileForm, password_confirmation: e.target.value })}
                          placeholder="Confirm new password"
                        />
                        <div className="input-icon">
                          <i className="fas fa-check-double"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setProfileForm({ name: user.name, email: user.email, password: '', password_confirmation: '' })}>
                    <i className="fas fa-undo"></i>
                    Reset Changes
                  </button>
                  <button type="submit" className="btn btn-primary-modern">
                    <i className="fas fa-save"></i>
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="profile-card account-status">
            <div className="card-header-modern">
              <div className="card-icon">
                <i className="fas fa-user-shield"></i>
              </div>
              <h3>Account Status</h3>
            </div>
            <div className="card-body-modern">
              <div className="status-grid">
                <div className="status-item">
                  <div className="status-icon">
                    <i className="fas fa-crown"></i>
                  </div>
                  <div className="status-info">
                    <h4>Role</h4>
                    <span className="role-badge admin">Administrator</span>
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="status-info">
                    <h4>Member Since</h4>
                    <span>{user ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="status-info">
                    <h4>Last Login</h4>
                    <span>{user ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <div className="status-info">
                    <h4>Account Status</h4>
                    <span className="status-badge active">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Tips Card */}
          <div className="profile-card security-tips">
            <div className="card-header-modern">
              <div className="card-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3>Security Tips</h3>
            </div>
            <div className="card-body-modern">
              <div className="tips-list">
                <div className="tip-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Use a strong password with at least 8 characters</span>
                </div>
                <div className="tip-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Include numbers, symbols, and mixed case letters</span>
                </div>
                <div className="tip-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Don't share your password with anyone</span>
                </div>
                <div className="tip-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Enable two-factor authentication when available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;