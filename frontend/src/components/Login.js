import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    axios.get('/sanctum/csrf-cookie').then(() => {
      axios.post('/api/login', { email, password })
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
          setError(err.response?.data?.message || 'Login failed. Please try again.');
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
        maxWidth: '400px',
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
          }}>Welcome Back</h1>
          <p style={{
            fontSize: '15px',
            margin: 0,
            color: '#757575'
          }}>Sign in to your StepUp account</p>
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
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontWeight: '500',
                fontSize: '14px',
                color: '#111',
                marginBottom: '8px'
              }}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#111',
                  margin: 0
                }}>Password</label>
                <Link to="/forgot-password" style={{
                  fontSize: '14px',
                  color: '#757575',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}>Forgot?</Link>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Footer Link */}
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#757575'
            }}>
              Don't have an account?{' '}
              <Link to="/register" style={{
                color: '#111',
                fontWeight: '500',
                textDecoration: 'underline'
              }}>Join Us</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
