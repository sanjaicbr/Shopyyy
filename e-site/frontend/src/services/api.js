import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cbr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cbr_token');
      localStorage.removeItem('cbr_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

// Product APIs
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/meta/categories'),
  getBrands: () => api.get('/products/meta/brands'),
};

// Cart APIs
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (variant_id, quantity) => api.post('/cart/add', { variant_id, quantity }),
  update: (cartId, quantity) => api.put(`/cart/${cartId}`, { quantity }),
  remove: (cartId) => api.delete(`/cart/${cartId}`),
  clear: () => api.delete('/cart'),
};

// Order APIs
export const orderAPI = {
  create: (data) => api.post('/orders/create', data),
  verifyPayment: (data) => api.post('/orders/verify-payment', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
};

// Discount APIs
export const discountAPI = {
  getAll: () => api.get('/discounts'),
  validate: (coupon_code, cart_total) => api.post('/discounts/validate', { coupon_code, cart_total }),
  create: (data) => api.post('/discounts', data),
  update: (id, data) => api.put(`/discounts/${id}`, data),
  delete: (id) => api.delete(`/discounts/${id}`),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (params) => api.get('/admin/analytics/sales', { params }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  // Workers
  getWorkers: () => api.get('/admin/workers'),
  addWorker: (data) => api.post('/admin/workers', data),
  updateWorker: (id, data) => api.put(`/admin/workers/${id}`, data),
  deleteWorker: (id) => api.delete(`/admin/workers/${id}`),
  // Attendance
  markAttendance: (data) => api.post('/admin/attendance', data),
  getAttendance: (workerId, params) => api.get(`/admin/attendance/${workerId}`, { params }),
  // Salary
  generateSalary: (data) => api.post('/admin/salary/generate', data),
  getSalaryHistory: (workerId) => api.get(`/admin/salary/${workerId}`),
  markSalaryPaid: (salaryId, payment_mode) => api.put(`/admin/salary/${salaryId}/pay`, { payment_mode }),
};

// Supplier APIs
export const supplierAPI = {
  getAll: () => api.get('/suppliers'),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getPurchaseOrders: () => api.get('/suppliers/purchase-orders'),
  createPurchaseOrder: (data) => api.post('/suppliers/purchase-orders', data),
};

export default api;
