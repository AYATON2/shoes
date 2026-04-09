const normalizeBaseUrl = (url) => (url || '').replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const envBase = normalizeBaseUrl(process.env.REACT_APP_API_URL);
  if (envBase) {
    return envBase;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Local dev default to Laravel's artisan serve port.
    if (isLocalhost && port !== '8000') {
      return 'http://localhost:8000';
    }

    if (!isLocalhost && !envBase) {
      // Keep current behavior (same-origin) but make misconfiguration visible in production logs.
      console.warn('REACT_APP_API_URL is not set. Using same-origin API base URL:', `${protocol}//${hostname}${port ? `:${port}` : ''}`);
    }

    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  return 'http://localhost:8000';
};

export const buildApiAssetUrl = (path) => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
