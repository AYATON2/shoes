import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'token';
export const USER_STORAGE_KEY = 'user';

export const getToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const authHeaders = (token = getToken()) => (
  token ? { Authorization: `Bearer ${token}` } : {}
);

/**
 * Send the token on every axios request from now on.
 */
export const applyAuthToken = (token = getToken()) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
  return token;
};

/**
 * Persist the credentials returned by the login/register endpoints.
 */
export const storeSession = (token, user) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
  applyAuthToken(token);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  applyAuthToken(null);
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};
