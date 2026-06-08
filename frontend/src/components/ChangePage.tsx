import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface Change {
  id: string
  title: string
  description: string
  type: string // NORMAL | EMERGENCIA | PADRAO
  status: string // RASCUNHO | ANALISE | APROVACAO | APROVADO | EXECUCAO | ENCERRADO | CANCELADO
  risk: string // BAIXO | MEDIO | ALTO
  justification: string
  impact_description?: string
  rollback_plan?: string
  implementation_plan?: string
  opened_by_user_id: string
  assigned_to_user_id?: string
  scheduled_start?: string
  scheduled_end?: string
  actual_start?: string
  actual_end?: string
  created_at: string
  closed_at?: string
}

interface ChangePageProps {
  token: string
}

interface CreateFormData {
  title: string
  description: string
  type: string
  risk: string
  justification: string
  impact_description: string
  rollback_plan: string
  implementation_plan: string
  scheduled_start: string
  scheduled_end: string
}

interface EditFormData {
  status: string
  rollback_plan: string
  implementation_plan: string
  impact_description: string
}

const STATUS_STYLES: Record<string, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-700',
  ANALISE: 'bg-yellow-100 text-yellow-800',
  APROVACAO: 'bg-blue-100 text-blue-800',
  APROVADO: 'bg-teal-100 text-teal-800',
  EXECUCAO: 'bg-purple-100 text-purple-800',
  ENCERRADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ANALISE: 'Em Análise',
  APROVACAO: 'Em Aprovação',
  APROVADO: 'Aprovado',
  EXECUCAO: 'Em Execução',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
}

const TYPE_STYLES: Record<string, string> = {
  NORMAL: 'bg-blue-100 text-blue-800',
  EMERGENCIA: 'bg-red-100 text-red-800',
  PADRAO: 'bg-gray-100 text-gray-700',
}

const TYPE_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  EMERGENCIA: 'Emergência',
  PADRAO: 'Padrão',
}

const RISK_STYLES: Record<string, string> = {
  BAIXO: 'bg-green-100 text-green-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  ALTO: 'bg-red-100 text-red-800',
}

const RISK_LABELS: Record<string, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
}

const FILTER_TABS = ['Todos', 'RASCUNHO', 'ANALISE', 'APROVACAO', 'APROVADO', 'EXECUCAO']

const STEPPER_STATUSES = ['RASCUNHO', 'ANALISE', 'APROVACAO', 'APROVADO', 'EXECUCAO', 'ENCERRADO']

const INITIAL_CREATE: CreateFormData = {
  title: '',
  description: '',
  type: 'NORMAL',
  risk: 'BAIXO',
  justification: '',
  impact_description: '',
  rollback_plan: '',
  implementation_plan: '',
  scheduled_start: '',
  scheduled_end: '',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STEPPER_STATUSES.indexOf(currentStatus)
  const isCancelled = currentStatus === 'CANCELADO'

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center min-w-max">
        {STEPPER_STATUSES.map((status, index) => {
          const isDone = !isCancelled && currentIndex > index
          const isCurrent = currentStatus === status
          return (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : isDone
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </div>
                <span
                  className={`text-xs mt-1 font-medium whitespace-nowrap ${
                    isCurrent ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>
              {index < STEPPER_STATUSES.length - 1 && (
                <div
                  className={`h-0.5 w-8 mx-1 mt-[-14px] transition-all ${
                    !isCancelled && currentIndex > index ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
        {isCancelled && (
          <div className="flex items-center ml-4 gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-red-500 bg-red-500 text-white">
              ✕
            </div>
            <span className="text-xs ml-1 font-medium text-red-600 whitespace-nowrap">Cancelado</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ChangeDetailModal({
  change,
  token,
  onClose,
  onUpdated,
}: {
  change: Change
  token: string
  onClose: () => void
  onUpdated: () => void
}) {
  const toast = useToast()
  const [editData, setEditData] = useState<EditFormData>({
    status: change.status,
    rollback_plan: change.rollback_plan ?? '',
    implementation_plan: change.implementation_plan ?? '',
    impact_description: change.impact_description ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.patch(
        `/api/changes/${change.id}`,
        {
          status: editData.status,
          rollback_plan: editData.rollback_plan.trim() || undefined,
          implementation_plan: editData.implementation_plan.trim() || undefined,
          impact_description: editData.impact_description.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('RFC atualizada com sucesso!')
      onUpdated()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao atualizar RFC')
    } finally {
      setSaving(false)
    }
  }

  const allStatuses = [...STEPPER_STATUSES, 'CANCELADO']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[change.type] ?? 'bg-gray-100 text-gray-700'}`}>
                {TYPE_LABELS[change.type] ?? change.type}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[change.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[change.status] ?? change.status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_STYLES[change.risk] ?? 'bg-gray-100 text-gray-600'}`}>
                Risco: {RISK_LABELS[change.risk] ?? change.risk}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{change.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Aberta em {formatDate(change.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0">
            ✕
          </button>
        </div>

        {/* Status stepper */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <StatusStepper currentStatus={change.status} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descrição</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{change.description}</p>
          </div>

          {/* Justification */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Justificativa</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{change.justification}</p>
          </div>

          {/* Schedule */}
          {(change.scheduled_start || change.scheduled_end) && (
            <div className="grid grid-cols-2 gap-4">
              {change.scheduled_start && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Início Previsto</h3>
                  <p className="text-sm text-gray-700">{formatDateTime(change.scheduled_start)}</p>
                </div>
              )}
              {change.scheduled_end && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fim Previsto</h3>
                  <p className="text-sm text-gray-700">{formatDateTime(change.scheduled_end)}</p>
                </div>
              )}
            </div>
          )}

          {(change.actual_start || change.actual_end) && (
            <div className="grid grid-cols-2 gap-4">
              {change.actual_start && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Início Real</h3>
                  <p className="text-sm text-gray-700">{formatDateTime(change.actual_start)}</p>
                </div>
              )}
              {change.actual_end && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fim Real</h3>
                  <p className="text-sm text-gray-700">{formatDateTime(change.actual_end)}</p>
                </div>
              )}
            </div>
          )}

          {/* Read-only fields */}
          {change.impact_description && !editData.impact_description && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Impacto</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{change.impact_description}</p>
            </div>
          )}

          {/* Edit form */}
          <form id="change-edit-form" onSubmit={handleSave} className="space-y-4 border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-800">Atualizar RFC</h3>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editData.status}
                onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>
            </div>

            {/* Impact description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Impacto</label>
              <textarea
                value={editData.impact_description}
                onChange={(e) => setEditData((p) => ({ ...p, impact_description: e.target.value }))}
                rows={3}
                placeholder="Descreva o impacto esperado da mudança..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Implementation plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Implementação</label>
              <textarea
                value={editData.implementation_plan}
                onChange={(e) => setEditData((p) => ({ ...p, implementation_plan: e.target.value }))}
                rows={3}
                placeholder="Descreva os passos de implementação..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Rollback plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Rollback</label>
              <textarea
                value={editData.rollback_plan}
                onChange={(e) => setEditData((p) => ({ ...p, rollback_plan: e.target.value }))}
                rows={3}
                placeholder="Como reverter a mudança se necessário..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            form="change-edit-form"
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
          >
            {saving ? (
              <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</>
            ) : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export function ChangePage({ token }: ChangePageProps) {
  const toast = useToast()
  const [changes, setChanges] = useState<Change[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateFormData>(INITIAL_CREATE)
  const [activeTab, setActiveTab] = useState('Todos')
  const [selectedChange, setSelectedChange] = useState<Change | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchChanges = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/changes/', { headers })
      const data = response.data
      setChanges(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar mudanças. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchChanges() }, [fetchChanges])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) { toast.warning('Título é obrigatório'); return }
    if (!formData.description.trim()) { toast.warning('Descrição é obrigatória'); return }
    if (!formData.justification.trim()) { toast.warning('Justificativa é obrigatória'); return }
    setSubmitting(true)
    try {
      await axios.post('/api/changes/', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        risk: formData.risk,
        justification: formData.justification.trim(),
        impact_description: formData.impact_description.trim() || undefined,
        rollback_plan: formData.rollback_plan.trim() || undefined,
        implementation_plan: formData.implementation_plan.trim() || undefined,
        scheduled_start: formData.scheduled_start || undefined,
        scheduled_end: formData.scheduled_end || undefined,
      }, { headers })
      toast.success('RFC criada com sucesso!')
      setFormData(INITIAL_CREATE)
      setShowForm(false)
      fetchChanges()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar RFC')
    } finally {
      setSubmitting(false)
    }
  }

  const visibleChanges = changes.filter((c) =>
    activeTab === 'Todos' ? true : c.status === activeTab,
  )

  const countByStatus = (status: string) => changes.filter((c) => c.status === status).length

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {selectedChange && (
        <ChangeDetailModal
          change={selectedChange}
          token={token}
          onClose={() => setSelectedChange(null)}
          onUpdated={fetchChanges}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Mudanças (RFC)</h2>
          <p className="text-gray-500 text-sm mt-0.5">Controle de mudanças e processo de aprovação CAB</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex-shrink-0"
        >
          {showForm ? '✕ Cancelar' : '+ Nova RFC'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Nova Requisição de Mudança</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Descreva brevemente a mudança proposta"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Descreva em detalhes o que será alterado"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Mudança</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="EMERGENCIA">Emergência</option>
                  <option value="PADRAO">Padrão</option>
                </select>
              </div>

              {/* Risk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risco</label>
                <select
                  value={formData.risk}
                  onChange={(e) => setFormData((p) => ({ ...p, risk: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BAIXO">Baixo</option>
                  <option value="MEDIO">Médio</option>
                  <option value="ALTO">Alto</option>
                </select>
              </div>
            </div>

            {/* Justification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justificativa <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData((p) => ({ ...p, justification: e.target.value }))}
                rows={3}
                placeholder="Por que esta mudança é necessária? Qual o benefício esperado?"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Impact description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Impacto</label>
              <textarea
                value={formData.impact_description}
                onChange={(e) => setFormData((p) => ({ ...p, impact_description: e.target.value }))}
                rows={2}
                placeholder="Quais sistemas e usuários serão afetados?"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Implementation plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Implementação</label>
              <textarea
                value={formData.implementation_plan}
                onChange={(e) => setFormData((p) => ({ ...p, implementation_plan: e.target.value }))}
                rows={3}
                placeholder="Descreva os passos para implementar a mudança..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Rollback plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Rollback</label>
              <textarea
                value={formData.rollback_plan}
                onChange={(e) => setFormData((p) => ({ ...p, rollback_plan: e.target.value }))}
                rows={2}
                placeholder="Como reverter caso algo dê errado?"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Início Previsto</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData((p) => ({ ...p, scheduled_start: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fim Previsto</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData((p) => ({ ...p, scheduled_end: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
              >
                {submitting
                  ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Criando...</>
                  : 'Criar RFC'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormData(INITIAL_CREATE) }}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'Todos' ? 'Todos' : STATUS_LABELS[tab]}
            {tab !== 'Todos' && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {countByStatus(tab)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Change list */}
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
      ) : visibleChanges.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🔄</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {activeTab === 'Todos' ? 'Nenhuma RFC registrada' : `Nenhuma RFC com status "${STATUS_LABELS[activeTab]}"`}
          </h3>
          <p className="text-gray-400 text-sm">
            {activeTab === 'Todos'
              ? 'Clique em "+ Nova RFC" para criar a primeira requisição de mudança.'
              : 'Tente outro filtro de status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{visibleChanges.length} RFC(s) encontrada(s)</p>
          {visibleChanges.map((change) => (
            <div
              key={change.id}
              onClick={() => setSelectedChange(change)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-base">🔄</span>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {change.title}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{change.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[change.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {TYPE_LABELS[change.type] ?? change.type}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[change.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[change.status] ?? change.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_STYLES[change.risk] ?? 'bg-gray-100 text-gray-600'}`}>
                      Risco: {RISK_LABELS[change.risk] ?? change.risk}
                    </span>
                    {change.scheduled_start && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        Previsto: {formatDateTime(change.scheduled_start)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-gray-400">{formatDate(change.created_at)}</p>
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
