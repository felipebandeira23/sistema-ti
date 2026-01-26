// Tipos compartilhados do sistema COPPEAD ITSM

// ============ AUTENTICAÇÃO ============
export interface User {
  user_id: string
  username: string
  email: string
  full_name: string
  roles: Role[]
  active: boolean
  last_login?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
}

// ============ USUÁRIOS ============
export type Role = 'admin' | 'tecnico' | 'usuario' | 'gerente' | 'aprovador'

export interface UserProfile {
  user_id: string
  username: string
  email: string
  full_name: string
  department: string
  phone?: string
  avatar_url?: string
  roles: Role[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface UserListItem {
  user_id: string
  username: string
  full_name: string
  email: string
  department: string
  roles: Role[]
  active: boolean
  last_login?: string
}

// ============ TICKETS ITSM ============
export type TicketType = 'INCIDENTE' | 'REQUISIÇÃO' | 'PROBLEMA' | 'MUDANÇA'
export type TicketPriority = 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA'
export type TicketStatus = 'ABERTO' | 'EM_PROGRESSO' | 'FECHADO' | 'AGUARDANDO_USUARIO' | 'RESOLVIDO'

export interface Ticket {
  id: string
  number: string
  title: string
  description: string
  type: TicketType
  status: TicketStatus
  priority: TicketPriority
  opened_by: string
  assigned_to?: string
  created_at: string
  updated_at: string
  closed_at?: string
  sla_status?: 'OK' | 'ALERTA' | 'VIOLADO'
  sla_remaining_time?: number
}

export interface TicketDetail extends Ticket {
  full_description: string
  internal_notes?: string
  attachments?: Attachment[]
  comments?: TicketComment[]
  history?: TicketHistoryItem[]
  feedback?: TicketFeedback
  related_tickets?: string[]
  tags?: string[]
}

export interface TicketComment {
  id: string
  ticket_id: string
  author: string
  content: string
  is_internal: boolean
  created_at: string
  attachments?: Attachment[]
}

export interface TicketHistoryItem {
  id: string
  ticket_id: string
  action: string
  changed_by: string
  old_value?: string
  new_value?: string
  created_at: string
}

export interface TicketFeedback {
  id: string
  ticket_id: string
  rating: number // 1-5
  comment?: string
  created_at: string
}

export interface Attachment {
  id: string
  filename: string
  file_size: number
  uploaded_at: string
  uploaded_by: string
  url: string
}

// ============ ATIVOS ============
export type AssetType = 'HARDWARE' | 'PERIFÉRICO' | 'REDE' | 'MÓVEL' | 'SOFTWARE' | 'SERVIDOR' | 'CONSUMÍVEL'
export type AssetStatus = 'DISPONÍVEL' | 'EM_USO' | 'MANUTENÇÃO' | 'APOSENTADO'

export interface Asset {
  id: string
  code: string
  name: string
  asset_type: AssetType
  status: AssetStatus
  serial_number?: string
  model?: string
  manufacturer?: string
  purchase_date?: string
  location?: string
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface AssetDetail extends Asset {
  full_specifications?: string
  maintenance_history?: MaintenanceRecord[]
  related_tickets?: string[]
}

export interface MaintenanceRecord {
  id: string
  asset_id: string
  date: string
  description: string
  performed_by: string
  cost?: number
}

// ============ CMDB ============
export type ConfigItemType = 'HARDWARE' | 'SOFTWARE' | 'SERVIÇO' | 'APLICAÇÃO' | 'BANCO_DADOS' | 'REDE' | 'DOCUMENTAÇÃO'
export type RelationshipType = 'HOSPEDA' | 'DEPENDE_DE' | 'FORNECE_ACESSO_A' | 'USA' | 'CONECTA_A' | 'FALHA_AFETA'

export interface ConfigurationItem {
  id: string
  code: string
  name: string
  type: ConfigItemType
  description?: string
  status: 'ATIVA' | 'INATIVA' | 'DEPRECADA'
  owner?: string
  created_at: string
  updated_at: string
}

export interface CIRelationship {
  id: string
  source_ci_id: string
  target_ci_id: string
  relationship_type: RelationshipType
  created_at: string
}

export interface CIImpactAnalysis {
  ci_id: string
  direct_impacts: string[]
  indirect_impacts: string[]
  total_affected: number
  estimated_downtime_minutes?: number
}

// ============ CATÁLOGO DE SERVIÇOS ============
export interface ServiceCatalogCategory {
  id: string
  name: string
  description?: string
  icon?: string
  parent_id?: string
  order: number
  active: boolean
}

export interface ServiceCatalogItem {
  id: string
  category_id: string
  name: string
  description: string
  icon?: string
  form_schema?: Record<string, any> // JSON Schema
  requires_approval: boolean
  sla_hours?: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ServiceRequest {
  id: string
  service_item_id: string
  requested_by: string
  form_data: Record<string, any>
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'ENTREGANDO' | 'ENTREGUE'
  approval_level: number
  created_at: string
  updated_at: string
}

// ============ SLA ============
export interface SLADefinition {
  id: string
  name: string
  ticket_type: TicketType
  priority: TicketPriority
  response_time_hours: number
  resolution_time_hours: number
  calendar_id?: string
  active: boolean
}

export interface SLAStatus {
  ticket_id: string
  sla_id: string
  status: 'OK' | 'ALERTA' | 'VIOLADO'
  response_time_remaining?: number
  resolution_time_remaining?: number
  estimated_resolve_at: string
}

export interface Calendar {
  id: string
  name: string
  timezone: string
  working_days: number[] // 0-6 (domingo-sábado)
  working_hours_start: string // "09:00"
  working_hours_end: string // "18:00"
  holidays?: Holiday[]
}

export interface Holiday {
  id: string
  calendar_id: string
  date: string
  name: string
  recurring: boolean
}

// ============ BASE DE CONHECIMENTO ============
export interface KnowledgeArticle {
  id: string
  title: string
  content: string // Markdown
  category_id?: string
  tags: string[]
  status: 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO'
  author: string
  created_at: string
  updated_at: string
  views_count: number
}

export interface KnowledgeCategory {
  id: string
  name: string
  description?: string
  parent_id?: string
  order: number
}

export interface KnowledgeSuggestion {
  article_id: string
  title: string
  relevance_score: number
  reason: string
}

// ============ APROVAÇÕES ============
export interface ApprovalRequest {
  id: string
  request_type: 'SERVICE_REQUEST' | 'CHANGE' | 'PROBLEM' | 'CUSTOM'
  request_id: string
  requested_by: string
  current_level: number
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO'
  created_at: string
  updated_at: string
  approvers?: ApprovalLevel[]
}

export interface ApprovalLevel {
  level: number
  role_required: Role
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO'
  approver?: string
  decision_at?: string
  comments?: string
}

// ============ DASHBOARD ============
export interface DashboardMetrics {
  total_tickets: number
  open_tickets: number
  overdue_tickets: number
  sla_compliance: number
  average_resolution_time: number
  customer_satisfaction: number
  tickets_by_priority: Record<TicketPriority, number>
  tickets_by_status: Record<TicketStatus, number>
  tickets_by_type: Record<TicketType, number>
}

export interface TicketTrend {
  date: string
  created: number
  closed: number
  overdue: number
}

// ============ AUDITORIA ============
export interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  performed_by: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// ============ NOTIFICAÇÕES ============
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  related_ticket?: string
  read: boolean
  created_at: string
}

export interface NotificationPreference {
  user_id: string
  email_on_ticket_created: boolean
  email_on_ticket_assigned: boolean
  email_on_ticket_updated: boolean
  email_on_sla_warning: boolean
  email_on_approval_request: boolean
  email_on_approval_decision: boolean
  in_app_notifications: boolean
}

// ============ RESPOSTAS API ============
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiError {
  detail: string
  status: number
  errors?: Record<string, string[]>
}
