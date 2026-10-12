const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('topbox_token') || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('topbox_token', token);
  } else {
    localStorage.removeItem('topbox_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // Unauthorized
    // Clear token if invalid
    localStorage.removeItem('topbox_token');
  }

  if (!res.ok) {
    const errorText = await res.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      errorJson = { detail: errorText };
    }
    throw new Error(errorJson.detail || `Request failed with status ${res.status}`);
  }

  // Return json or blob or text
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return await res.text();
}

export const api = {
  auth: {
    login: async (username, password) => {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
      }
      return await res.json();
    },
    me: () => request('/auth/me'),
    listUsers: () => request('/auth/users'),
    createUser: (userData) => request('/auth/users', { method: 'POST', body: JSON.stringify(userData) }),
    updateUser: (id, userData) => request(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) })
  },
  tickets: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/tickets?${query}`);
    },
    get: (id) => request(`/tickets/${id}`),
    updatePassport: (id, data) => request(`/tickets/${id}/passport`, { method: 'PUT', body: JSON.stringify(data) }),
    getMessages: (id) => request(`/tickets/${id}/messages`),
    sendMessage: (id, data) => request(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),
    sendKey: (id) => request(`/tickets/${id}/send-key`, { method: 'POST' }),
    recreateKey: (id, data = {}) => request(`/tickets/${id}/recreate-key`, { method: 'POST', body: JSON.stringify(data) }),
    sendGuide: (id, platform) => request(`/tickets/${id}/send-guide?platform=${platform}`, { method: 'POST' }),
    sendAiSetup: (id) => request(`/tickets/${id}/send-ai-setup`, { method: 'POST' }),
    uploadAttachment: (id, formData) => request(`/tickets/${id}/upload`, { method: 'POST', body: formData }),
    resolve: (id) => request(`/tickets/${id}/resolve`, { method: 'POST' }),
    escalate: (id) => request(`/tickets/${id}/escalate`, { method: 'POST' }),
    getVpnKeys: (id) => request(`/tickets/${id}/vpn-keys`),
    getTaxonomy: () => request('/tickets/taxonomy'),
    getRefundablePayments: (id) => request('/tickets/' + id + '/refundable-payments'),
    processRefund: (id, data) => request('/tickets/' + id + '/refund', { method: 'POST', body: JSON.stringify(data) })
  },
  analytics: {
    healthOverview: (days = 7) => request(`/analytics/health-overview?days=${days}`),
    topProblems: (days = 7) => request(`/analytics/top-problems?days=${days}`),
    drilldownAnomalies: (days = 14) => request(`/analytics/drilldown-anomalies?days=${days}`),
    dailyReport: () => request('/analytics/reports/daily'),
    weeklyReport: () => request('/analytics/reports/weekly')
  },
  problems: {
    list: () => request('/problems'),
    create: (data) => request('/problems', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/problems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    listBacklog: () => request('/problems/backlog'),
    createBacklog: (data) => request('/problems/backlog', { method: 'POST', body: JSON.stringify(data) }),
    updateBacklog: (id, data) => request(`/problems/backlog/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  knowledge: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/knowledge?${query}`);
    },
    create: (data) => request('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  ai: {
    triage: (id) => request(`/ai/triage/${id}`, { method: 'POST' }),
    suggest: (id) => request(`/ai/suggest/${id}`, { method: 'POST' }),
    getModels: () => request('/ai/models')
  },
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'POST', body: JSON.stringify(data) })
  },
  webhooks: {
    simulate: (data) => request('/webhooks/simulate', { method: 'POST', body: JSON.stringify(data) })
  }
};
