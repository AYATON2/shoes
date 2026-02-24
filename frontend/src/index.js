import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import App from './App';
import reportWebVitals from './reportWebVitals';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';

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

// Register Service Worker for PWA support (works on all platforms)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered for cross-platform support:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New version available! Please refresh.');
            }
          });
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// iOS standalone mode detection
if (window.navigator.standalone) {
  console.log('Running as iOS PWA');
}

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
