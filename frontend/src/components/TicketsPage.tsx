import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'
import { TicketDetailModal } from './TicketDetailModal'
import type { TicketDetail } from './TicketDetailModal'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  status: string
  priority: string
  type: string
  urgency?: string
  impact?: string
  opened_by_user_id: string
  assigned_to_user_id?: string
  created_at: string
  updated_at?: string
  resolved_at?: string
  sla_status?: string
  sla_target_response?: string
  sla_target_resolution?: string
}

interface FormData {
  title: string
  description: string
  type: string
  priority: string
  urgency: string
  impact: string
}

interface FormErrors {
  title?: string
  description?: string
}

interface TicketsPageProps {
  token: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  NOVO: 'bg-blue-100 text-blue-800',
  TRIAGEM: 'bg-yellow-100 text-yellow-800',
  EM_ANDAMENTO: 'bg-purple-100 text-purple-800',
  AGUARDANDO: 'bg-orange-100 text-orange-800',
  RESOLVIDO: 'bg-teal-100 text-teal-800',
  FECHADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  TRIAGEM: 'Triagem',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO: 'Aguardando',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
}

const PRIORITY_STYLES: Record<string, string> = {
  P1_CRÍTICO: 'bg-red-100 text-red-800',
  P2_ALTO: 'bg-orange-100 text-orange-800',
  P3_MÉDIO: 'bg-yellow-100 text-yellow-800',
  P4_BAIXO: 'bg-green-100 text-green-800',
}

const PRIORITY_LABELS: Record<string, string> = {
  P1_CRÍTICO: 'P1 - Crítico',
  P2_ALTO: 'P2 - Alto',
  P3_MÉDIO: 'P3 - Médio',
  P4_BAIXO: 'P4 - Baixo',
}

const TYPE_ICONS: Record<string, string> = {
  INCIDENTE: '🚨',
  REQUISIÇÃO: '📋',
  PROBLEMA: '🔧',
  MUDANÇA: '🔄',
}

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  type: 'INCIDENTE',
  priority: 'P3_MÉDIO',
  urgency: 'MÉDIA',
  impact: 'INDIVIDUAL',
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.title.trim()) {
    errors.title = 'Título é obrigatório'
  } else if (data.title.trim().length < 5) {
    errors.title = 'Título deve ter ao menos 5 caracteres'
  }
  if (!data.description.trim()) {
    errors.description = 'Descrição é obrigatória'
  } else if (data.description.trim().length < 10) {
    errors.description = 'Descrição deve ter ao menos 10 caracteres'
  }
  return errors
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TicketsPage({ token }: TicketsPageProps) {
  const toast = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.status_filter = filterStatus
      if (filterPriority) params.priority_filter = filterPriority
      if (filterType) params.type_filter = filterType
      if (search) params.q = search
      const response = await axios.get('/api/tickets/', { headers, params })
      const data = response.data
      setTickets(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar tickets. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }, [token, filterStatus, filterPriority, filterType, search])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    setSubmitting(true)
    try {
      await axios.post(
        '/api/tickets/',
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          priority: formData.priority,
          urgency: formData.urgency,
          impact: formData.impact,
        },
        { headers },
      )
      toast.success('Ticket criado com sucesso!')
      setFormData(INITIAL_FORM)
      setShowForm(false)
      fetchTickets()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar ticket. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field in formErrors) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const hasFilters = !!(filterStatus || filterPriority || filterType || search)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Detail modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          token={token}
          onClose={() => setSelectedTicket(null)}
          onUpdated={fetchTickets}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tickets</h2>
          <p className="text-gray-500 text-sm mt-0.5">Incidentes, requisições, problemas e mudanças</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormErrors({}) }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex-shrink-0"
        >
          {showForm ? '✕ Cancelar' : '+ Novo Ticket'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Novo Ticket</h3>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Descreva brevemente o problema ou solicitação"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  formErrors.title ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                }`}
              />
              {formErrors.title && (
                <p className="text-red-600 text-xs mt-1">{formErrors.title}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Detalhe o que aconteceu, quando e como reproduzir"
                rows={4}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none ${
                  formErrors.description ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                }`}
              />
              {formErrors.description && (
                <p className="text-red-600 text-xs mt-1">{formErrors.description}</p>
              )}
              <p className="text-gray-400 text-xs mt-1 text-right">{formData.description.length} caracteres</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="INCIDENTE">🚨 Incidente</option>
                  <option value="REQUISIÇÃO">📋 Requisição</option>
                  <option value="PROBLEMA">🔧 Problema</option>
                  <option value="MUDANÇA">🔄 Mudança</option>
                </select>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="P1_CRÍTICO">🔴 P1 - Crítico</option>
                  <option value="P2_ALTO">🟠 P2 - Alto</option>
                  <option value="P3_MÉDIO">🟡 P3 - Médio</option>
                  <option value="P4_BAIXO">🟢 P4 - Baixo</option>
                </select>
              </div>

              {/* Urgência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgência</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => handleFieldChange('urgency', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="CRÍTICA">Crítica</option>
                  <option value="ALTA">Alta</option>
                  <option value="MÉDIA">Média</option>
                  <option value="BAIXA">Baixa</option>
                </select>
              </div>

              {/* Impacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impacto</label>
                <select
                  value={formData.impact}
                  onChange={(e) => handleFieldChange('impact', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="MÚLTIPLOS">Múltiplos usuários/sistemas</option>
                  <option value="ALGUNS">Alguns usuários/sistemas</option>
                  <option value="INDIVIDUAL">Individual</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Criando...
                  </>
                ) : 'Criar Ticket'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormErrors({}); setFormData(INITIAL_FORM) }}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por título, descrição ou número..."
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="NOVO">Novo</option>
            <option value="TRIAGEM">Triagem</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="AGUARDANDO">Aguardando</option>
            <option value="RESOLVIDO">Resolvido</option>
            <option value="FECHADO">Fechado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as prioridades</option>
            <option value="P1_CRÍTICO">P1 - Crítico</option>
            <option value="P2_ALTO">P2 - Alto</option>
            <option value="P3_MÉDIO">P3 - Médio</option>
            <option value="P4_BAIXO">P4 - Baixo</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            <option value="INCIDENTE">Incidente</option>
            <option value="REQUISIÇÃO">Requisição</option>
            <option value="PROBLEMA">Problema</option>
            <option value="MUDANÇA">Mudança</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterType(''); setSearch('') }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🎫</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {hasFilters ? 'Nenhum ticket encontrado' : 'Nenhum ticket ainda'}
          </h3>
          <p className="text-gray-400 text-sm">
            {hasFilters
              ? 'Tente remover ou ajustar os filtros.'
              : 'Clique em "+ Novo Ticket" para criar o primeiro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{tickets.length} ticket(s) encontrado(s)</p>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket as TicketDetail)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base">{TYPE_ICONS[ticket.type] ?? '🎫'}</span>
                    <span className="text-xs font-mono text-gray-400">#{ticket.ticket_number}</span>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {ticket.title}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{ticket.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                      {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {ticket.type}
                    </span>
                    {ticket.sla_status && ticket.sla_status !== 'OK' && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        ticket.sla_status === 'EXPIRADO'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        SLA {ticket.sla_status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-gray-400">
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(ticket.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <span className="text-gray-300 group-hover:text-blue-400 transition text-xl">›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
