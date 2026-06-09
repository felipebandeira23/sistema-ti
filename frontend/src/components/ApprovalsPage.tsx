import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface Approval {
  id: string
  ticket_id: string
  level: number
  required_approver_count: number
  status: string
  expires_at?: string
  created_at: string
  updated_at?: string
}

interface ApprovalsPageProps {
  token: string
}

const STATUS_STYLES: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  APROVADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-red-100 text-red-800',
  CANCELADO: 'bg-gray-100 text-gray-600',
  // english fallbacks
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const STATUS_ICONS: Record<string, string> = {
  PENDENTE: '⏳',
  APROVADO: '✓',
  REJEITADO: '✕',
  CANCELADO: '○',
  pending: '⏳',
  approved: '✓',
  rejected: '✕',
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  CANCELADO: 'Cancelado',
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

function RejectModal({
  onConfirm, onClose, isLoading,
}: {
  onConfirm: (comment: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [comment, setComment] = useState('')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Rejeitar Aprovação</h3>
          <p className="text-sm text-gray-500 mt-1">Informe o motivo da rejeição</p>
        </div>
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment} onChange={(e) => setComment(e.target.value)} rows={4} autoFocus
            placeholder="Descreva o motivo da rejeição..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3">
          <button
            onClick={() => { if (comment.trim()) onConfirm(comment.trim()) }}
            disabled={!comment.trim() || isLoading}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Rejeitando...</> : '✕ Confirmar Rejeição'}
          </button>
          <button onClick={onClose} disabled={isLoading}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition text-sm font-medium">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function ApproveModal({
  onConfirm, onClose, isLoading,
}: {
  onConfirm: (comment: string) => void
  onClose: () => void
  isLoading: boolean
}) {
  const [comment, setComment] = useState('')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Aprovar Solicitação</h3>
          <p className="text-sm text-gray-500 mt-1">Adicione um comentário opcional</p>
        </div>
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Comentário (opcional)</label>
          <textarea
            value={comment} onChange={(e) => setComment(e.target.value)} rows={3} autoFocus
            placeholder="Observações sobre a aprovação..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3">
          <button onClick={() => onConfirm(comment)} disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm font-medium flex items-center justify-center gap-2">
            {isLoading ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Aprovando...</> : '✓ Confirmar Aprovação'}
          </button>
          <button onClick={onClose} disabled={isLoading}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition text-sm font-medium">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export function ApprovalsPage({ token }: ApprovalsPageProps) {
  const toast = useToast()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDENTE')
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [approveTarget, setApproveTarget] = useState<string | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchApprovals = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== 'ALL' ? { status: filter } : {}
      const res = await axios.get('/api/approvals/', { headers, params })
      const data = res.data
      setApprovals(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar aprovações')
    } finally {
      setLoading(false)
    }
  }, [token, filter])

  useEffect(() => { fetchApprovals() }, [fetchApprovals])

  const decide = async (approvalId: string, decision: 'APROVADO' | 'REJEITADO', comment: string) => {
    setActionLoading(true)
    try {
      await axios.post(`/api/approvals/${approvalId}/decisions`, { decision, comment: comment || undefined }, { headers })
      toast.success(decision === 'APROVADO' ? 'Solicitação aprovada com sucesso!' : 'Solicitação rejeitada')
      setApproveTarget(null)
      setRejectTarget(null)
      fetchApprovals()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Erro ao ${decision === 'APROVADO' ? 'aprovar' : 'rejeitar'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const FILTERS = [
    { value: 'PENDENTE', label: '⏳ Pendentes' },
    { value: 'APROVADO', label: '✓ Aprovadas' },
    { value: 'REJEITADO', label: '✕ Rejeitadas' },
    { value: 'ALL', label: 'Todas' },
  ]

  const isExpired = (a: Approval) => a.expires_at && new Date(a.expires_at) < new Date()

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {rejectTarget && (
        <RejectModal
          isLoading={actionLoading}
          onClose={() => setRejectTarget(null)}
          onConfirm={(comment) => decide(rejectTarget, 'REJEITADO', comment)}
        />
      )}
      {approveTarget && (
        <ApproveModal
          isLoading={actionLoading}
          onClose={() => setApproveTarget(null)}
          onConfirm={(comment) => decide(approveTarget, 'APROVADO', comment)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fluxo de Aprovações</h2>
        <p className="text-gray-500 text-sm mt-0.5">Aprovações pendentes de tickets e requisições de serviço</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma aprovação encontrada</h3>
          <p className="text-gray-400 text-sm">
            {filter === 'PENDENTE' ? 'Sem aprovações pendentes no momento.' : `Sem aprovações com status "${STATUS_LABELS[filter] ?? filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{approvals.length} aprovação(ões)</p>
          {approvals.map((approval) => {
            const expired = isExpired(approval)
            const isPending = approval.status === 'PENDENTE' || approval.status === 'pending'
            return (
              <div key={approval.id}
                className={`bg-white rounded-xl shadow-sm border p-6 transition ${
                  expired && isPending ? 'border-red-200 bg-red-50' : 'border-gray-100 hover:shadow-md'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">
                        Aprovação — Ticket #{approval.ticket_id.slice(0, 8)}…
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[approval.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_ICONS[approval.status]} {STATUS_LABELS[approval.status] ?? approval.status}
                      </span>
                      {expired && isPending && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          ⚠️ Expirado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span>Nível: <strong className="text-gray-700">{approval.level}</strong></span>
                      <span>Quórum: <strong className="text-gray-700">{approval.required_approver_count} aprovador(es)</strong></span>
                      {approval.expires_at && (
                        <span>Expira: <strong className="text-gray-700">{new Date(approval.expires_at).toLocaleDateString('pt-BR')}</strong></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Criado em {new Date(approval.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {isPending && !expired && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setApproveTarget(approval.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium">
                        ✓ Aprovar
                      </button>
                      <button onClick={() => setRejectTarget(approval.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium">
                        ✕ Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
