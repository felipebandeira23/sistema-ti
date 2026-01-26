// API configuration
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
  },
  TICKETS: {
    LIST: '/api/tickets',
    CREATE: '/api/tickets',
    UPDATE: (id: string) => `/api/tickets/${id}`,
    STATUS: (id: string) => `/api/tickets/${id}/status`,
  },
  ASSETS: {
    LIST: '/api/assets',
    CREATE: '/api/assets',
  },
  CMDB: {
    LIST: '/api/cmdb/cis',
    CREATE: '/api/cmdb/cis',
    UPDATE: (id: string) => `/api/cmdb/cis/${id}`,
  },
  CATALOG: {
    CATEGORIES: '/api/catalog/categories',
    ITEMS: '/api/catalog/items',
    CREATE_ITEM: '/api/catalog/items',
  },
  KNOWLEDGE: {
    LIST: '/api/knowledge/articles',
    CREATE: '/api/knowledge/articles',
  },
  APPROVALS: {
    LIST: '/api/approvals',
    APPROVE: (id: string) => `/api/approvals/${id}/approve`,
    REJECT: (id: string) => `/api/approvals/${id}/reject`,
  },
  SLA: {
    LIST: '/api/sla',
    CREATE: '/api/sla',
  },
}

export default API_ENDPOINTS
