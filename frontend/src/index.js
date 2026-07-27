import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { getApiBaseUrl } from './utils/apiUrl';
import { applyAuthToken } from './utils/auth';

console.log('App Version: 1.0.5 - Build Time: ' + new Date().toISOString());

axios.defaults.withCredentials = true;
axios.defaults.baseURL = getApiBaseUrl();
axios.defaults.headers.common['Accept'] = 'application/json';

applyAuthToken();

const root = ReactDOM.createRoot(document.getElementById('root'));

// Global error handler for ChunkLoadErrors (Stale Build Recovery)
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('ChunkLoadError') || e.message.includes('Loading chunk'))) {
    console.warn('Stale build detected (404 on JS chunk). Reloading page to fetch latest version...');
    window.location.reload();
  }
}, true);

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
  error => Promise.reject(error)
);
