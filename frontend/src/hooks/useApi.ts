import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { User, Ticket, Asset, ConfigurationItem, KnowledgeArticle, DashboardMetrics } from '../types'

// ============ AUTENTICAÇÃO ============
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await apiClient.getMe()
      return response.user as User
    },
    enabled: !!localStorage.getItem('token'),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// ============ USUÁRIOS ============
export function useUsers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: async () => {
      const response = await apiClient.getUsers(page, pageSize)
      return response
    },
  })
}

export function useUser_ById(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await apiClient.getUser(userId)
      return response as User
    },
    enabled: !!userId,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Record<string, any> }) => {
      return await apiClient.updateUser(userId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useSyncLDAPUsers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      return await apiClient.syncLDAPUsers()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// ============ TICKETS ============
export function useTickets(filters?: {
  status?: string
  priority?: string
  type?: string
  assigned_to?: string
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const response = await apiClient.getTickets(filters)
      return response
    },
  })
}

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const response = await apiClient.getTicket(ticketId)
      return response as Ticket
    },
    enabled: !!ticketId,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiClient.createTicket(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: string; data: Record<string, any> }) => {
      return await apiClient.updateTicket(ticketId, data)
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      return await apiClient.updateTicketStatus(ticketId, status)
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}

export function useAddTicketComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: string; data: { content: string; is_internal?: boolean } }) => {
      return await apiClient.addTicketComment(ticketId, data)
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId, 'comments'],
    queryFn: async () => {
      const response = await apiClient.getTicketComments(ticketId)
      return response
    },
    enabled: !!ticketId,
  })
}

export function useAddTicketFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: string; data: { rating: number; comment?: string } }) => {
      return await apiClient.addTicketFeedback(ticketId, data)
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}

export function useTicketSLAStatus(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId, 'sla-status'],
    queryFn: async () => {
      const response = await apiClient.getTicketSLAStatus(ticketId)
      return response
    },
    enabled: !!ticketId,
    refetchInterval: 1000 * 60, // Atualizar a cada minuto
  })
}

// ============ ATIVOS ============
export function useAssets(filters?: { status?: string; type?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async () => {
      const response = await apiClient.getAssets(filters)
      return response
    },
  })
}

export function useAsset(assetId: string) {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const response = await apiClient.getAsset(assetId)
      return response as Asset
    },
    enabled: !!assetId,
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiClient.createAsset(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ assetId, data }: { assetId: string; data: Record<string, any> }) => {
      return await apiClient.updateAsset(assetId, data)
    },
    onSuccess: (_, { assetId }) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
    },
  })
}

export function useUpdateAssetStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ assetId, status }: { assetId: string; status: string }) => {
      return await apiClient.updateAssetStatus(assetId, status)
    },
    onSuccess: (_, { assetId }) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
    },
  })
}

// ============ CMDB ============
export function useConfigItems(filters?: { type?: string; status?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['config-items', filters],
    queryFn: async () => {
      const response = await apiClient.getConfigItems(filters)
      return response
    },
  })
}

export function useConfigItem(itemId: string) {
  return useQuery({
    queryKey: ['config-item', itemId],
    queryFn: async () => {
      const response = await apiClient.getConfigItem(itemId)
      return response as ConfigurationItem
    },
    enabled: !!itemId,
  })
}

export function useCreateConfigItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiClient.createConfigItem(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-items'] })
    },
  })
}

export function useUpdateConfigItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Record<string, any> }) => {
      return await apiClient.updateConfigItem(itemId, data)
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['config-items'] })
      queryClient.invalidateQueries({ queryKey: ['config-item', itemId] })
    },
  })
}

export function useCIRelationships(ciId: string) {
  return useQuery({
    queryKey: ['config-item', ciId, 'relationships'],
    queryFn: async () => {
      const response = await apiClient.getCIRelationships(ciId)
      return response
    },
    enabled: !!ciId,
  })
}

export function useAddCIRelationship() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiClient.addCIRelationship(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-items'] })
    },
  })
}

export function useImpactAnalysis(ciId: string) {
  return useQuery({
    queryKey: ['config-item', ciId, 'impact-analysis'],
    queryFn: async () => {
      const response = await apiClient.getImpactAnalysis(ciId)
      return response
    },
    enabled: !!ciId,
  })
}

// ============ BASE DE CONHECIMENTO ============
export function useKnowledgeArticles(filters?: { category_id?: string; search?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['knowledge-articles', filters],
    queryFn: async () => {
      const response = await apiClient.getKnowledgeArticles(filters)
      return response
    },
  })
}

export function useKnowledgeArticle(articleId: string) {
  return useQuery({
    queryKey: ['knowledge-article', articleId],
    queryFn: async () => {
      const response = await apiClient.getKnowledgeArticle(articleId)
      return response as KnowledgeArticle
    },
    enabled: !!articleId,
  })
}

export function useCreateKnowledgeArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiClient.createKnowledgeArticle(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
    },
  })
}

export function useUpdateKnowledgeArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ articleId, data }: { articleId: string; data: Record<string, any> }) => {
      return await apiClient.updateKnowledgeArticle(articleId, data)
    },
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] })
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', articleId] })
    },
  })
}

export function useSearchKnowledgeArticles(query: string) {
  return useQuery({
    queryKey: ['knowledge-articles-search', query],
    queryFn: async () => {
      const response = await apiClient.searchKnowledgeArticles(query)
      return response
    },
    enabled: query.length > 2,
  })
}

export function useSuggestionsForTicket(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId, 'suggestions'],
    queryFn: async () => {
      const response = await apiClient.getSuggestionsForTicket(ticketId)
      return response
    },
    enabled: !!ticketId,
  })
}

// ============ DASHBOARD ============
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await apiClient.getDashboardMetrics()
      return response as DashboardMetrics
    },
    refetchInterval: 1000 * 60 * 5, // Atualizar a cada 5 minutos
  })
}

export function useTicketTrends(days = 30) {
  return useQuery({
    queryKey: ['ticket-trends', days],
    queryFn: async () => {
      const response = await apiClient.getTicketTrends(days)
      return response
    },
    refetchInterval: 1000 * 60 * 5, // Atualizar a cada 5 minutos
  })
}

// ============ NOTIFICAÇÕES ============
export function useNotifications(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['notifications', page, pageSize],
    queryFn: async () => {
      const response = await apiClient.getNotifications(page, pageSize)
      return response
    },
    refetchInterval: 1000 * 30, // Atualizar a cada 30 segundos
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiClient.markNotificationAsRead(notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.getNotificationPreferences()
      return response
    },
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await apiClient.updateNotificationPreferences(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
  })
}

// ============ APROVAÇÕES ============
export function useApprovalRequests(filters?: { status?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['approval-requests', filters],
    queryFn: async () => {
      const response = await apiClient.getApprovalRequests(filters)
      return response
    },
  })
}

export function useApprovalRequest(requestId: string) {
  return useQuery({
    queryKey: ['approval-request', requestId],
    queryFn: async () => {
      const response = await apiClient.getApprovalRequest(requestId)
      return response
    },
    enabled: !!requestId,
  })
}

export function useApproveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ requestId, decision }: { requestId: string; decision: { approved: boolean; comments?: string } }) => {
      return await apiClient.approveRequest(requestId, decision)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] })
    },
  })
}

// ============ AUDITORIA ============
export function useAuditLogs(filters?: { entity_type?: string; action?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const response = await apiClient.getAuditLogs(filters)
      return response
    },
  })
}
