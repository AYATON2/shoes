const normalizeBaseUrl = (url) => {
  if (!url) return '';
  let normalized = url.trim().replace(/\/+$/, '');
  if (normalized && !normalized.startsWith('http')) {
    normalized = `https://${normalized}`;
  }
  return normalized;
};

export const getApiBaseUrl = () => {
  const envBase = normalizeBaseUrl(process.env.REACT_APP_API_URL);
  if (envBase) return envBase;

  const RAILWAY_BACKEND = 'https://shoes-production-04ab.up.railway.app';

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost && port !== '8000') {
      return `http://${hostname}:8000`;
    }

    // On Railway, if they are separate services, we MUST point to the backend service.
    // If you have a different backend domain, please update this link or set REACT_APP_API_URL.
    const finalUrl = hostname.includes('railway.app') ? RAILWAY_BACKEND : `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    console.log('Final Resolved API URL:', finalUrl);
    return finalUrl;
  }

  return 'http://127.0.0.1:8000';
};

export const isCrossOriginApi = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const apiOrigin = new URL(getApiBaseUrl()).origin;
    return apiOrigin !== window.location.origin;
  } catch (error) {
    return false;
  }
};

export const buildApiAssetUrl = (path) => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/')
    ? path
    : path.startsWith('storage/')
      ? `/${path}`
      : `/storage/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
