import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface TicketDetail {
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
  sla_status?: string
  sla_target_response?: string
  sla_target_resolution?: string
  solution?: string
  root_cause?: string
  created_at: string
  updated_at?: string
  resolved_at?: string
}

interface Comment {
  id: string
  ticket_id: string
  author_id: string
  content: string
  is_public: boolean
  created_at: string
}

interface HistoryEntry {
  id: string
  field: string
  old_value?: string
  new_value?: string
  changed_by_user_id: string
  created_at: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: string // PENDENTE | EM_ANDAMENTO | CONCLUÍDO
  due_date?: string
  created_at: string
}

interface SimilarTicket {
  id: string
  ticket_number: number
  title: string
  status: string
  priority: string
}

export interface TicketDetailModalProps {
  ticket: TicketDetail
  token: string
  onClose: () => void
  onUpdated: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  TRIAGEM: 'Triagem',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO: 'Aguardando',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
}

const STATUS_STYLES: Record<string, string> = {
  NOVO: 'bg-blue-100 text-blue-800',
  TRIAGEM: 'bg-yellow-100 text-yellow-800',
  EM_ANDAMENTO: 'bg-purple-100 text-purple-800',
  AGUARDANDO: 'bg-orange-100 text-orange-800',
  RESOLVIDO: 'bg-teal-100 text-teal-800',
  FECHADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-gray-100 text-gray-600',
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

const TASK_STATUSES = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUÍDO']

const TASK_STATUS_STYLES: Record<string, string> = {
  PENDENTE: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  CONCLUÍDO: 'bg-green-100 text-green-700 hover:bg-green-200',
}

const TASK_STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUÍDO: 'Concluído',
}

type TabId = 'detalhes' | 'comentarios' | 'tarefas' | 'historico'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getInitial(userId: string): string {
  return userId.charAt(0).toUpperCase()
}

// ─── SLA Bar ──────────────────────────────────────────────────────────────────

function SlaBar({ ticket }: { ticket: TicketDetail }) {
  if (!ticket.sla_target_resolution) return null

  const createdMs = new Date(ticket.created_at).getTime()
  const targetMs = new Date(ticket.sla_target_resolution).getTime()
  const nowMs = Date.now()
  const totalMs = targetMs - createdMs
  const elapsedMs = nowMs - createdMs
  const pct = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 100

  const slaStatus = ticket.sla_status ?? 'OK'
  const barColor =
    slaStatus === 'EXPIRADO' ? 'bg-red-500' :
    slaStatus === 'CRÍTICO' ? 'bg-yellow-500' :
    'bg-green-500'
  const labelColor =
    slaStatus === 'EXPIRADO' ? 'text-red-600' :
    slaStatus === 'CRÍTICO' ? 'text-yellow-600' :
    'text-green-600'

  return (
    <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium">SLA Resolução</span>
        <span className={`text-xs font-semibold ${labelColor}`}>
          {slaStatus} — Prazo: {formatDateTime(ticket.sla_target_resolution)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5 text-right">{Math.round(pct)}% do prazo utilizado</p>
    </div>
  )
}

// ─── Tab: Detalhes ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-800">{value}</dd>
    </div>
  )
}

function DetailsTab({
  ticket,
  token,
  onUpdated,
}: {
  ticket: TicketDetail
  token: string
  onUpdated: () => void
}) {
  const toast = useToast()
  const [newStatus, setNewStatus] = useState(ticket.status)
  const [solution, setSolution] = useState(ticket.solution ?? '')
  const [savingStatus, setSavingStatus] = useState(false)
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingSimilar(true)
    axios
      .get('/api/ai/similar-tickets', {
        params: { q: ticket.title },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!cancelled) {
          const data = res.data
          setSimilarTickets(Array.isArray(data) ? data.slice(0, 3) : (data.items ?? []).slice(0, 3))
        }
      })
      .catch(() => { /* silently ignore AI endpoint failures */ })
      .finally(() => { if (!cancelled) setLoadingSimilar(false) })
    return () => { cancelled = true }
  }, [ticket.id, ticket.title, token])

  const needsSolution = newStatus === 'RESOLVIDO' || newStatus === 'FECHADO'

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingStatus(true)
    try {
      await axios.patch(
        `/api/tickets/${ticket.id}/status`,
        { status: newStatus, solution: needsSolution && solution.trim() ? solution.trim() : undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Status atualizado com sucesso!')
      onUpdated()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao atualizar status')
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Read-only info */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descrição</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow label="Urgência" value={ticket.urgency} />
        <InfoRow label="Impacto" value={ticket.impact} />
        <InfoRow label="Prioridade" value={PRIORITY_LABELS[ticket.priority] ?? ticket.priority} />
        <InfoRow label="Tipo" value={ticket.type} />
        <InfoRow label="Aberto por" value={ticket.opened_by_user_id} />
        <InfoRow label="Atribuído a" value={ticket.assigned_to_user_id} />
        <InfoRow label="Criado em" value={formatDateTime(ticket.created_at)} />
        <InfoRow label="Resolvido em" value={ticket.resolved_at ? formatDateTime(ticket.resolved_at) : null} />
        {ticket.solution && <InfoRow label="Solução" value={ticket.solution} />}
        {ticket.root_cause && <InfoRow label="Causa Raiz" value={ticket.root_cause} />}
      </dl>

      {/* Status update */}
      <form onSubmit={handleStatusUpdate} className="border-t border-gray-100 pt-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Atualizar Status</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={savingStatus || newStatus === ticket.status}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2 flex-shrink-0"
          >
            {savingStatus ? (
              <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</>
            ) : 'Atualizar'}
          </button>
        </div>
        {needsSolution && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solução <span className="text-gray-400 text-xs">(recomendado para resolução/fechamento)</span>
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={3}
              placeholder="Descreva como o ticket foi resolvido..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </form>

      {/* AI Similar Tickets */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Tickets Similares (IA)</h3>
        {loadingSimilar ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
            Buscando sugestões...
          </div>
        ) : similarTickets.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum ticket similar encontrado.</p>
        ) : (
          <div className="space-y-2">
            {similarTickets.map((st) => (
              <div key={st.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-blue-500 text-base mt-0.5">💡</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    <span className="text-xs font-mono text-gray-400 mr-1">#{st.ticket_number}</span>
                    {st.title}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[st.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[st.status] ?? st.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[st.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                      {PRIORITY_LABELS[st.priority] ?? st.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Comentários ─────────────────────────────────────────────────────────

function CommentsTab({ ticket, token }: { ticket: TicketDetail; token: string }) {
  const toast = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`/api/tickets/${ticket.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = res.data
      setComments(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar comentários')
    } finally {
      setLoading(false)
    }
  }, [ticket.id, token, toast])

  useEffect(() => { fetchComments() }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) { toast.warning('Comentário não pode ser vazio'); return }
    setSubmitting(true)
    try {
      await axios.post(
        `/api/tickets/${ticket.id}/comments`,
        { content: content.trim(), is_public: isPublic },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Comentário adicionado!')
      setContent('')
      fetchComments()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao adicionar comentário')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
        Carregando comentários...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">Nenhum comentário ainda.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {getInitial(c.author_id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700 truncate">{c.author_id}</span>
                  <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.is_public ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {c.is_public ? 'Público' : 'Interno'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Adicione um comentário..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-between gap-3">
          {/* Public/Internal toggle */}
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isPublic
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
            }`}
          >
            {isPublic ? '🌐 Público' : '🔒 Interno'}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
          >
            {submitting ? (
              <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Enviando...</>
            ) : 'Comentar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Tab: Tarefas ─────────────────────────────────────────────────────────────

function TasksTab({ ticket, token }: { ticket: TicketDetail; token: string }) {
  const toast = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`/api/tickets/${ticket.id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = res.data
      setTasks(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }, [ticket.id, token, toast])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const cycleStatus = async (task: Task) => {
    const currentIdx = TASK_STATUSES.indexOf(task.status)
    const nextStatus = TASK_STATUSES[(currentIdx + 1) % TASK_STATUSES.length]
    setUpdatingTaskId(task.id)
    try {
      await axios.patch(
        `/api/tickets/${ticket.id}/tasks/${task.id}`,
        null,
        {
          params: { status: nextStatus },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t))
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao atualizar tarefa')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) { toast.warning('Título da tarefa é obrigatório'); return }
    setCreatingTask(true)
    try {
      await axios.post(
        `/api/tickets/${ticket.id}/tasks`,
        {
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          due_date: newDueDate || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Tarefa criada!')
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      setShowNewTask(false)
      fetchTasks()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar tarefa')
    } finally {
      setCreatingTask(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
        Carregando tarefas...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.length === 0 && !showNewTask && (
        <p className="text-sm text-gray-400 py-4 text-center">Nenhuma tarefa associada.</p>
      )}

      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <button
            onClick={() => cycleStatus(task)}
            disabled={updatingTaskId === task.id}
            title="Clique para avançar o status"
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition flex-shrink-0 mt-0.5 ${TASK_STATUS_STYLES[task.status] ?? 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {updatingTaskId === task.id ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current inline-block" />
            ) : TASK_STATUS_LABELS[task.status] ?? task.status}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.status === 'CONCLUÍDO' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
            )}
            {task.due_date && (
              <p className="text-xs text-gray-400 mt-0.5">Prazo: {formatDate(task.due_date)}</p>
            )}
          </div>
        </div>
      ))}

      {/* New task form */}
      {showNewTask ? (
        <form onSubmit={handleCreateTask} className="border border-dashed border-blue-300 rounded-lg p-4 space-y-3 bg-blue-50">
          <h4 className="text-sm font-semibold text-gray-700">Nova Tarefa</h4>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título da tarefa *"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
            placeholder="Descrição (opcional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creatingTask}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
            >
              {creatingTask ? (
                <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Criando...</>
              ) : 'Criar Tarefa'}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewTask(false); setNewTitle(''); setNewDescription(''); setNewDueDate('') }}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 border border-gray-300 transition text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewTask(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition"
        >
          + Nova Tarefa
        </button>
      )}
    </div>
  )
}

// ─── Tab: Histórico ───────────────────────────────────────────────────────────

function HistoryTab({ ticket, token }: { ticket: TicketDetail; token: string }) {
  const toast = useToast()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get(`/api/tickets/${ticket.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data
        setHistory(Array.isArray(data) ? data : data.items ?? [])
      })
      .catch(() => { toast.error('Erro ao carregar histórico') })
      .finally(() => { setLoading(false) })
  }, [ticket.id, token, toast])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
        Carregando histórico...
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">Nenhuma alteração registrada.</p>
    )
  }

  return (
    <div className="space-y-1">
      {history.map((entry, idx) => (
        <div key={entry.id} className="flex gap-3">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
            {idx < history.length - 1 && (
              <div className="w-px flex-1 bg-gray-200 mt-1" />
            )}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">{formatDateTime(entry.created_at)}</p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{entry.field}</span>
              {entry.old_value != null && (
                <>
                  {' '}alterado de{' '}
                  <span className="font-mono text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                    {entry.old_value}
                  </span>
                </>
              )}
              {entry.new_value != null && (
                <>
                  {' '}para{' '}
                  <span className="font-mono text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                    {entry.new_value}
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">por {entry.changed_by_user_id}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'detalhes', label: 'Detalhes' },
  { id: 'comentarios', label: 'Comentários' },
  { id: 'tarefas', label: 'Tarefas' },
  { id: 'historico', label: 'Histórico' },
]

export function TicketDetailModal({ ticket, token, onClose, onUpdated }: TicketDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('detalhes')
  const [loadedTabs, setLoadedTabs] = useState<Set<TabId>>(new Set(['detalhes']))

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setLoadedTabs((prev) => new Set([...prev, tab]))
  }

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-base">{TYPE_ICONS[ticket.type] ?? '🎫'}</span>
              <span className="text-xs font-mono text-gray-400">#{ticket.ticket_number}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[ticket.status] ?? ticket.status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {ticket.type}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">{ticket.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Aberto em {formatDateTime(ticket.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0 mt-1"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* SLA Bar */}
        <SlaBar ticket={ticket} />

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'detalhes' && loadedTabs.has('detalhes') && (
            <DetailsTab ticket={ticket} token={token} onUpdated={onUpdated} />
          )}
          {activeTab === 'comentarios' && loadedTabs.has('comentarios') && (
            <CommentsTab ticket={ticket} token={token} />
          )}
          {activeTab === 'tarefas' && loadedTabs.has('tarefas') && (
            <TasksTab ticket={ticket} token={token} />
          )}
          {activeTab === 'historico' && loadedTabs.has('historico') && (
            <HistoryTab ticket={ticket} token={token} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
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
