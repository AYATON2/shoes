import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import App from './App';
import reportWebVitals from './reportWebVitals';

axios.defaults.withCredentials = true;
// Default to backend API at port 8000 in development so API calls are routed
// to the Laravel backend instead of the CRA dev server (which returns 404).
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Gracefully handle network errors during development so the error overlay
// doesn't break the UI when the API backend is not running.
axios.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      // Network error / backend not reachable — return a harmless fallback
      console.warn('Suppressed API network error:', error.message);
      return Promise.resolve({ data: {}, status: 503, statusText: 'Service Unavailable' });
    }
    return Promise.reject(error);
  }
);
