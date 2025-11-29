// API Client utility functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth APIs
export const authApi = {
  login: (email: string, password: string) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (userData: any) =>
    apiCall('/api/auth/register', {
      method: 'POST',
      body: userData,
    }),
};

// PTT APIs
export const pttApi = {
  request: (data: any) =>
    apiCall('/api/ptt/request', {
      method: 'POST',
      body: data,
    }),

  issue: (data: any) =>
    apiCall('/api/ptt/issue', {
      method: 'POST',
      body: data,
    }),

  getById: (pttId: string) =>
    apiCall(`/api/ptt/${pttId}`),

  getByUser: (userId: string) =>
    apiCall(`/api/ptt/user/${userId}`),
};

// Document APIs
export const documentApi = {
  upload: async (formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  },

  approve: (data: any) =>
    apiCall('/api/documents/approve', {
      method: 'POST',
      body: data,
    }),

  getByPTT: (pttId: string) =>
    apiCall(`/api/documents/${pttId}`),
};

// Discounting APIs
export const discountingApi = {
  createOffer: (data: any) =>
    apiCall('/api/discounting/offer', {
      method: 'POST',
      body: data,
    }),

  getMarketplace: (filters?: any) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiCall(`/api/discounting/marketplace${params ? `?${params}` : ''}`);
  },

  acceptOffer: (data: any) =>
    apiCall('/api/discounting/accept', {
      method: 'POST',
      body: data,
    }),

  processPayment: (data: any) =>
    apiCall('/api/discounting/pay', {
      method: 'POST',
      body: data,
    }),
};

// Settlement APIs
export const settlementApi = {
  trigger: (pttId: string) =>
    apiCall('/api/settlement/trigger', {
      method: 'POST',
      body: { ptt_id: pttId },
    }),

  processPayment: (data: any) =>
    apiCall('/api/settlement/pay', {
      method: 'POST',
      body: data,
    }),

  confirm: (settlementId: string) =>
    apiCall('/api/settlement/confirm', {
      method: 'POST',
      body: { settlement_id: settlementId },
    }),
};

export default apiCall;
