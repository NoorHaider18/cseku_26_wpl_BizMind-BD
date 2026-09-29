const TOKEN_KEY = 'sme_intelligence_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else {
    const text = await response.text().catch(() => '');
    data = { error: text || `Request failed with status ${response.status}` };
  }

  if (!response.ok) {
    throw new Error(data.error || data.details || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth & Profile
  login: (credentials: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request<any>('/api/auth/me'),
  updateProfile: (data: any) => request<any>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getBusinessProfile: () => request<any>('/api/business/profile'),
  updateBusinessProfile: (data: any) => request<any>('/api/business/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Products
  getProducts: (params?: { search?: string; category?: string; low_stock?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category) q.set('category', params.category);
    if (params?.low_stock) q.set('low_stock', 'true');
    return request<any[]>(`/api/products?${q.toString()}`);
  },
  getProduct: (id: string) => request<any>(`/api/products/${id}`),
  createProduct: (data: any) => request<any>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<any>(`/api/products/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventory: () => request<any>('/api/inventory'),
  adjustInventory: (data: { product_id: string; type: string; quantity: number; reason: string }) =>
    request<any>('/api/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryAlerts: () => request<any>('/api/inventory/alerts'),
  getRisks: () => request<any>('/api/risks'),

  // Sales
  getSales: (params?: { search?: string; start_date?: string; end_date?: string; limit?: number; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.page) q.set('page', String(params.page));
    return request<{ total: number; sales: any[] }>(`/api/sales?${q.toString()}`);
  },
  createSale: (data: any) => request<any>('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
  getSale: (id: string) => request<any>(`/api/sales/${id}`),
  getSalesSummary: () => request<any>('/api/sales/summary'),

  // Suppliers
  getSuppliers: () => request<any[]>('/api/suppliers'),
  getSupplier: (id: string) => request<any>(`/api/suppliers/${id}`),
  createSupplier: (data: any) => request<any>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  compareSuppliers: () => request<any[]>('/api/suppliers/compare'),

  // Procurement
  getPurchaseOrders: () => request<any[]>('/api/purchase-orders'),
  getPurchaseOrder: (id: string) => request<any>(`/api/purchase-orders/${id}`),
  createPurchaseOrder: (data: any) => request<any>('/api/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  approvePurchaseOrder: (id: string) => request<any>(`/api/purchase-orders/${id}/approve`, { method: 'POST' }),
  updatePurchaseOrderStatus: (id: string, status: string) =>
    request<any>(`/api/purchase-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Expenses
  getExpenses: (params?: { category?: string; month?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.month) q.set('month', params.month);
    return request<{ summary: any; expenses: any[] }>(`/api/expenses?${q.toString()}`);
  },
  createExpense: (data: any) => request<any>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: any) => request<any>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: string) => request<any>(`/api/expenses/${id}`, { method: 'DELETE' }),

  // Analytics
  getDashboardAnalytics: () => request<any>('/api/analytics/dashboard'),
  getSalesAnalytics: () => request<any>('/api/analytics/sales'),
  getProfitAnalytics: () => request<any>('/api/analytics/profit'),
  getInventoryAnalytics: () => request<any>('/api/analytics/inventory'),
  getSupplierAnalytics: () => request<any[]>('/api/analytics/suppliers'),

  // Forecast
  getForecasts: (days = 14) => request<any[]>(`/api/forecast?days=${days}`),
  getProductForecast: (productId: string, days = 14) => request<any>(`/api/forecast/${productId}?days=${days}`),

  // Alerts
  getAlerts: () => request<any[]>('/api/alerts'),
  resolveAlert: (id: string) => request<any>(`/api/alerts/${id}/resolve`, { method: 'POST' }),

  // AI & Recommendations
  chatAi: (message: string) => request<any>('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getRecommendations: () => request<any[]>('/api/ai/recommendations'),
  approveRecommendation: (id: string) => request<any>(`/api/ai/recommendations/${id}/approve`, { method: 'POST' }),
  rejectRecommendation: (id: string) => request<any>(`/api/ai/recommendations/${id}/reject`, { method: 'POST' }),

  // Customers & Utilities
  getCustomers: () => request<any[]>('/api/customers'),
  getEmployees: () => request<any[]>('/api/employees'),
  getAuditLogs: () => request<any[]>('/api/audit-logs'),
  resetDemoData: () => request<any>('/api/system/reset-demo', { method: 'POST' }),
};
