const normalizeBaseUrl = (url) => (url || '').replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const envBase = normalizeBaseUrl(process.env.REACT_APP_API_URL);
  if (envBase) return envBase;

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost && port !== '8000') {
      return `http://${hostname}:8000`;
    }

    // Default to current domain (works for same-domain setups and relative deployments)
    const finalUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
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
