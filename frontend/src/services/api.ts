import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiError } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class APIClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Recuperar token do localStorage
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      this.setToken(savedToken)
    }

    // Interceptor de erro
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          this.clearToken()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  setToken(token: string) {
    this.token = token
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  }

  clearToken() {
    this.token = null
    delete this.client.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  getToken(): string | null {
    return this.token
  }

  // ============ AUTENTICAÇÃO ============
  async login(username: string, password: string) {
    const response = await this.client.post('/auth/login', { username, password })
    const { access_token } = response.data.token
    this.setToken(access_token)
    return response.data
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } finally {
      this.clearToken()
    }
  }

  async refreshToken() {
    const response = await this.client.post('/auth/refresh')
    const { access_token } = response.data.token
    this.setToken(access_token)
    return response.data
  }

  async getMe() {
    const response = await this.client.get('/auth/me')
    return response.data
  }

  // ============ USUÁRIOS ============
  async getUsers(page = 1, pageSize = 20) {
    const response = await this.client.get('/users', {
      params: { page, page_size: pageSize },
    })
    return response.data
  }

  async getUser(userId: string) {
    const response = await this.client.get(`/users/${userId}`)
    return response.data
  }

  async updateUser(userId: string, data: Record<string, any>) {
    const response = await this.client.put(`/users/${userId}`, data)
    return response.data
  }

  async syncLDAPUsers() {
    const response = await this.client.post('/admin/users/sync-ldap')
    return response.data
  }

  // ============ TICKETS ============
  async getTickets(filters?: {
    status?: string
    priority?: string
    type?: string
    assigned_to?: string
    page?: number
    page_size?: number
  }) {
    const response = await this.client.get('/tickets', { params: filters })
    return response.data
  }

  async getTicket(ticketId: string) {
    const response = await this.client.get(`/tickets/${ticketId}`)
    return response.data
  }

  async createTicket(data: Record<string, any>) {
    const response = await this.client.post('/tickets', data)
    return response.data
  }

  async updateTicket(ticketId: string, data: Record<string, any>) {
    const response = await this.client.put(`/tickets/${ticketId}`, data)
    return response.data
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const response = await this.client.patch(`/tickets/${ticketId}/status`, { status })
    return response.data
  }

  async addTicketComment(ticketId: string, data: { content: string; is_internal?: boolean }) {
    const response = await this.client.post(`/tickets/${ticketId}/comments`, data)
    return response.data
  }

  async getTicketComments(ticketId: string) {
    const response = await this.client.get(`/tickets/${ticketId}/comments`)
    return response.data
  }

  async addTicketFeedback(ticketId: string, data: { rating: number; comment?: string }) {
    const response = await this.client.post(`/tickets/${ticketId}/feedback`, data)
    return response.data
  }

  async getTicketSLAStatus(ticketId: string) {
    const response = await this.client.get(`/tickets/${ticketId}/sla-status`)
    return response.data
  }

  // ============ ATIVOS ============
  async getAssets(filters?: { status?: string; type?: string; page?: number; page_size?: number }) {
    const response = await this.client.get('/assets', { params: filters })
    return response.data
  }

  async getAsset(assetId: string) {
    const response = await this.client.get(`/assets/${assetId}`)
    return response.data
  }

  async createAsset(data: Record<string, any>) {
    const response = await this.client.post('/assets', data)
    return response.data
  }

  async updateAsset(assetId: string, data: Record<string, any>) {
    const response = await this.client.put(`/assets/${assetId}`, data)
    return response.data
  }

  async updateAssetStatus(assetId: string, status: string) {
    const response = await this.client.patch(`/assets/${assetId}/status`, { status })
    return response.data
  }

  // ============ CMDB ============
  async getConfigItems(filters?: { type?: string; status?: string; page?: number; page_size?: number }) {
    const response = await this.client.get('/cmdb/items', { params: filters })
    return response.data
  }

  async getConfigItem(itemId: string) {
    const response = await this.client.get(`/cmdb/items/${itemId}`)
    return response.data
  }

  async createConfigItem(data: Record<string, any>) {
    const response = await this.client.post('/cmdb/items', data)
    return response.data
  }

  async updateConfigItem(itemId: string, data: Record<string, any>) {
    const response = await this.client.put(`/cmdb/items/${itemId}`, data)
    return response.data
  }

  async getCIRelationships(ciId: string) {
    const response = await this.client.get(`/cmdb/items/${ciId}/relationships`)
    return response.data
  }

  async addCIRelationship(data: Record<string, any>) {
    const response = await this.client.post('/cmdb/relationships', data)
    return response.data
  }

  async getImpactAnalysis(ciId: string) {
    const response = await this.client.get(`/cmdb/items/${ciId}/impact-analysis`)
    return response.data
  }

  // ============ CATÁLOGO DE SERVIÇOS ============
  async getServiceCategories() {
    const response = await this.client.get('/catalog/categories')
    return response.data
  }

  async getServiceCatalogItems(categoryId?: string) {
    const response = await this.client.get('/catalog/items', { params: { category_id: categoryId } })
    return response.data
  }

  async getServiceCatalogItem(itemId: string) {
    const response = await this.client.get(`/catalog/items/${itemId}`)
    return response.data
  }

  async createServiceRequest(data: Record<string, any>) {
    const response = await this.client.post('/service-requests', data)
    return response.data
  }

  async getServiceRequests(filters?: { status?: string; page?: number; page_size?: number }) {
    const response = await this.client.get('/service-requests', { params: filters })
    return response.data
  }

  // ============ APROVAÇÕES ============
  async getApprovalRequests(filters?: { status?: string; page?: number; page_size?: number }) {
    const response = await this.client.get('/approvals', { params: filters })
    return response.data
  }

  async getApprovalRequest(requestId: string) {
    const response = await this.client.get(`/approvals/${requestId}`)
    return response.data
  }

  async approveRequest(requestId: string, decision: { approved: boolean; comments?: string }) {
    const response = await this.client.post(`/approvals/${requestId}/decide`, decision)
    return response.data
  }

  // ============ BASE DE CONHECIMENTO ============
  async getKnowledgeArticles(filters?: { category_id?: string; search?: string; page?: number; page_size?: number }) {
    const response = await this.client.get('/knowledge/articles', { params: filters })
    return response.data
  }

  async getKnowledgeArticle(articleId: string) {
    const response = await this.client.get(`/knowledge/articles/${articleId}`)
    return response.data
  }

  async createKnowledgeArticle(data: Record<string, any>) {
    const response = await this.client.post('/knowledge/articles', data)
    return response.data
  }

  async updateKnowledgeArticle(articleId: string, data: Record<string, any>) {
    const response = await this.client.put(`/knowledge/articles/${articleId}`, data)
    return response.data
  }

  async searchKnowledgeArticles(query: string) {
    const response = await this.client.get('/knowledge/articles/search', { params: { q: query } })
    return response.data
  }

  async getSuggestionsForTicket(ticketId: string) {
    const response = await this.client.get(`/knowledge/suggest`, { params: { ticket_id: ticketId } })
    return response.data
  }

  // ============ SLA ============
  async getSLADefinitions() {
    const response = await this.client.get('/sla/definitions')
    return response.data
  }

  async getCalendars() {
    const response = await this.client.get('/sla/calendars')
    return response.data
  }

  // ============ DASHBOARD ============
  async getDashboardMetrics() {
    const response = await this.client.get('/dashboards/executive')
    return response.data
  }

  async getTicketTrends(days = 30) {
    const response = await this.client.get('/dashboards/ticket-trends', { params: { days } })
    return response.data
  }

  // ============ NOTIFICAÇÕES ============
  async getNotifications(page = 1, pageSize = 20) {
    const response = await this.client.get('/notifications', {
      params: { page, page_size: pageSize },
    })
    return response.data
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.client.patch(`/notifications/${notificationId}/read`)
    return response.data
  }

  async getNotificationPreferences() {
    const response = await this.client.get('/notifications/preferences')
    return response.data
  }

  async updateNotificationPreferences(data: Record<string, any>) {
    const response = await this.client.put('/notifications/preferences', data)
    return response.data
  }

  // ============ AUDITORIA ============
  async getAuditLogs(filters?: { entity_type?: string; action?: string; page?: number; page_size?: number }) {
    const response = await this.client.get('/audit-logs', { params: filters })
    return response.data
  }
}

// Instância global
export const apiClient = new APIClient()
