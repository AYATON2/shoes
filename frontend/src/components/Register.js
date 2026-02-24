import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'customer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    axios.get('/sanctum/csrf-cookie').then(() => {
      axios.post('/api/register', form)
        .then(res => {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
          
          const role = res.data.user.role;
          if (role === 'customer') navigate('/customer-dashboard');
          else if (role === 'seller') navigate('/seller-dashboard');
          else if (role === 'admin') navigate('/admin-dashboard');
          else navigate('/dashboard');
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Registration failed. Please try again.');
          setLoading(false);
        });
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px',
          textAlign: 'center',
          borderBottom: '1px solid #E5E5E5'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: 0,
            marginBottom: '8px',
            color: '#111'
          }}>Become a StepUp Member</h1>
          <p style={{
            fontSize: '15px',
            margin: 0,
            color: '#757575'
          }}>Create your account to get started</p>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          {error && (
            <div style={{
              backgroundColor: '#FFEBEE',
              color: '#D43F21',
              padding: '12px 16px',
              borderRadius: '4px',
              marginBottom: '24px',
              fontSize: '14px',
              border: '1px solid #FFCDD2'
            }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontWeight: '500',
                fontSize: '14px',
                color: '#111',
                marginBottom: '8px'
              }}>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  fontSize: '15px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1px solid #CCCCCC',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#111'}
                onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
              />
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontWeight: '500',
                fontSize: '14px',
                color: '#111',
                marginBottom: '8px'
              }}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  fontSize: '15px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1px solid #CCCCCC',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#111'}
                onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
              />
            </div>

            {/* Role Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontWeight: '500',
                fontSize: '14px',
                color: '#111',
                marginBottom: '8px'
              }}>I want to</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={loading}
                style={{
                  width: '100%',
                  fontSize: '15px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1px solid #CCCCCC',
                  cursor: 'pointer',
                  background: 'white',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#111'}
                onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
              >
                <option value="customer">Browse and Buy Products</option>
                <option value="seller">Sell My Products</option>
              </select>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontWeight: '500',
                fontSize: '14px',
                color: '#111',
                marginBottom: '8px'
              }}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  fontSize: '15px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1px solid #CCCCCC',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#111'}
                onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
              />
            </div>

            {/* Confirm Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontWeight: '500',
                fontSize: '14px',
                color: '#111',
                marginBottom: '8px'
              }}>Confirm Password</label>
              <input
                type="password"
                name="password_confirmation"
                placeholder="Re-enter your password"
                value={form.password_confirmation}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  fontSize: '15px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1px solid #CCCCCC',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#111'}
                onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: '500',
                marginBottom: '24px',
                background: '#111',
                color: '#FFF',
                border: 'none',
                borderRadius: '30px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Creating account...
                </>
              ) : (
                'Join Us'
              )}
            </button>

            {/* Footer Link */}
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#757575'
            }}>
              Already a member?{' '}
              <Link to="/login" style={{
                color: '#111',
                fontWeight: '500',
                textDecoration: 'underline'
              }}>Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
