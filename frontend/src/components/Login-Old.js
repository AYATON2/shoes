import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.get('/sanctum/csrf-cookie').then(() => {
      axios.post('/api/login', form).then(res => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        const role = res.data.user.role;
        if (role === 'customer') navigate('/customer-dashboard');
        else if (role === 'seller') navigate('/seller-dashboard');
        else if (role === 'admin') navigate('/admin-dashboard');
        else navigate('/dashboard');
      }).catch(err => alert('Login failed'));
    });
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0" style={{
              borderRadius: '15px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="card-header text-center" style={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                color: 'white',
                border: 'none',
                padding: '30px 20px'
              }}>
                <h1 className="mb-0" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Welcome Back</h1>
                <p className="mb-0">Sign in to your account</p>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-4">
                    <label className="form-label" style={{ fontWeight: 'bold' }}>Email Address</label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text" style={{ background: '#f8f9fa', border: '1px solid #ced4da' }}>
                          <i className="fas fa-envelope"></i>
                        </span>
                      </div>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        className="form-control"
                        placeholder="Enter your email"
                        style={{ borderLeft: 'none' }}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group mb-4">
                    <label className="form-label" style={{ fontWeight: 'bold' }}>Password</label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text" style={{ background: '#f8f9fa', border: '1px solid #ced4da' }}>
                          <i className="fas fa-lock"></i>
                        </span>
                      </div>
                      <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        className="form-control"
                        placeholder="Enter your password"
                        style={{ borderLeft: 'none' }}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-block"
                    style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '12px',
                      borderRadius: '25px'
                    }}
                  >
                    Login
                  </button>
                </form>
                <div className="text-center mt-4">
                  <p className="mb-0">Don't have an account? <Link to="/register" style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Sign Up</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;