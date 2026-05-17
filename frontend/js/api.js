import { BASE_URL } from './config.js';

const getToken = () => localStorage.getItem('token');

export async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const url = `${BASE_URL}${endpoint}`;
  const headers = { Authorization: `Bearer ${token}` };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      message = errData.message || message;
    } catch (e) {}
    throw new Error(message);
  }
  return res.json();
}

// Dashboard endpoints (original /api/dashboard/*)
export const dashboardAPI = {
  getStats: () => apiCall('/api/dashboard/stats'),
  getOrders: (status = 'all') => apiCall(`/api/dashboard/orders${status !== 'all' ? `?status=${status}` : ''}`),
  getTransactions: (type = 'all') => apiCall(`/api/dashboard/transactions${type !== 'all' ? `?type=${type}` : ''}`),
  getKyc: () => apiCall('/api/dashboard/kyc'),
  submitKyc: (data) => apiCall('/api/dashboard/kyc', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data) => apiCall('/api/dashboard/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// Product endpoints (your backend: /api/products, /api/products/my)
export const productAPI = {
  getMyProducts: () => apiCall('/api/products/my'),
  create: (formData) => apiCall('/api/products', { method: 'POST', body: formData }),
  update: (id, formData) => apiCall(`/api/products/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => apiCall(`/api/products/${id}`, { method: 'DELETE' }),
};