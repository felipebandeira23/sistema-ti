import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface Webhook {
  id: string
  name: string
  url: string
  event_type: string
  action: string
  is_active: boolean
  created_at: string
}

interface WebhookLog {
  id: string
  status_code: number
  created_at: string
  response?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  is_highlight: boolean
  scheduled_start: string
  scheduled_end: string
}

interface IntegrationsPageProps {
  token: string
}

interface WebhookFormData {
  name: string
  url: string
  event_type: string
  action: string
}

interface AnnouncementFormData {
  title: string
  content: string
  scheduled_start: string
  scheduled_end: string
  is_highlight: boolean
}

const INITIAL_WEBHOOK_FORM: WebhookFormData = {
  name: '',
  url: '',
  event_type: 'ticket_created',
  action: '',
}

const INITIAL_ANNOUNCEMENT_FORM: AnnouncementFormData = {
  title: '',
  content: '',
  scheduled_start: '',
  scheduled_end: '',
  is_highlight: false,
}

const EVENT_TYPE_OPTIONS = [
  { value: 'ticket_created', label: 'Ticket criado' },
  { value: 'ticket_updated', label: 'Ticket atualizado' },
  { value: 'approval_decided', label: 'Aprovação decidida' },
]

type TabId = 'webhooks' | 'announcements'

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function announcementStatus(a: Announcement): { label: string; style: string } {
  const now = Date.now()
  const start = new Date(a.scheduled_start).getTime()
  const end = new Date(a.scheduled_end).getTime()
  if (now >= start && now <= end) return { label: 'Ativo', style: 'bg-green-100 text-green-800' }
  if (now < start) return { label: 'Agendado', style: 'bg-yellow-100 text-yellow-800' }
  return { label: 'Expirado', style: 'bg-gray-100 text-gray-500' }
}

interface TestResultPanel {
  statusCode?: number
  text?: string
  error?: string
}

interface WebhookRowProps {
  webhook: Webhook
  token: string
  onToggled: (id: string, newActive: boolean) => void
}

function WebhookRow({ webhook, token, onToggled }: WebhookRowProps) {
  const toast = useToast()
  const [toggling, setToggling] = useState(false)
  const [testResult, setTestResult] = useState<TestResultPanel | null>(null)
  const [testing, setTesting] = useState(false)
  const [logs, setLogs] = useState<WebhookLog[] | null>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const handleToggle = async () => {
    setToggling(true)
    try {
      await axios.patch(
        `/api/integrations/webhooks/${webhook.id}`,
        { is_active: !webhook.is_active },
        { headers },
      )
      onToggled(webhook.id, !webhook.is_active)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao atualizar webhook')
    } finally {
      setToggling(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await axios.post(
        `/api/integrations/webhooks/${webhook.id}/test`,
        {},
        { headers },
      )
      setTestResult({ statusCode: res.status, text: JSON.stringify(res.data) })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } }
      setTestResult({
        statusCode: axiosErr.response?.status,
        error: JSON.stringify(axiosErr.response?.data ?? 'Erro ao testar webhook'),
      })
    } finally {
      setTesting(false)
    }
  }

  const handleShowLogs = async () => {
    if (showLogs) {
      setShowLogs(false)
      return
    }
    setShowLogs(true)
    if (logs !== null) return
    setLoadingLogs(true)
    try {
      const res = await axios.get(`/api/integrations/webhooks/${webhook.id}/logs`, { headers })
      setLogs(Array.isArray(res.data) ? res.data : res.data.items ?? [])
    } catch {
      toast.error('Erro ao carregar logs do webhook')
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition border-b border-gray-50">
        <td className="px-4 py-3 font-medium text-gray-900">{webhook.name}</td>
        <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[180px]" title={webhook.url}>
          {webhook.url.length > 40 ? `${webhook.url.slice(0, 40)}…` : webhook.url}
        </td>
        <td className="px-4 py-3 text-gray-600 text-xs">{webhook.event_type}</td>
        <td className="px-4 py-3 text-gray-500 text-xs">{webhook.action || '—'}</td>
        <td className="px-4 py-3">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              webhook.is_active
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {toggling ? '...' : webhook.is_active ? 'Ativo' : 'Inativo'}
          </button>
        </td>
        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(webhook.created_at)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
            >
              {testing ? '...' : 'Testar'}
            </button>
            <button
              onClick={handleShowLogs}
              className="text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              {showLogs ? 'Ocultar' : 'Logs'}
            </button>
          </div>
        </td>
      </tr>

      {/* Test result */}
      {testResult && (
        <tr className="bg-blue-50/40">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-xs font-semibold text-gray-500">Resultado do teste:</span>
              {testResult.statusCode && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  testResult.statusCode >= 200 && testResult.statusCode < 300
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  HTTP {testResult.statusCode}
                </span>
              )}
              <pre className="text-xs text-gray-600 flex-1 overflow-x-auto whitespace-pre-wrap break-all">
                {testResult.text ?? testResult.error}
              </pre>
              <button
                onClick={() => setTestResult(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </td>
        </tr>
      )}

      {/* Logs panel */}
      {showLogs && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Histórico de entregas</p>
            {loadingLogs ? (
              <div className="space-y-1">
                {[1, 2].map((i) => <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />)}
              </div>
            ) : !logs || logs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum log disponível.</p>
            ) : (
              <div className="space-y-1">
                {logs.slice(0, 10).map((wl) => (
                  <div key={wl.id} className="flex items-start gap-3 text-xs bg-white border border-gray-100 rounded-lg px-3 py-2">
                    <span className={`px-2 py-0.5 rounded font-mono font-medium flex-shrink-0 ${
                      wl.status_code >= 200 && wl.status_code < 300
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {wl.status_code}
                    </span>
                    <span className="text-gray-400 flex-shrink-0">{formatDate(wl.created_at)}</span>
                    {wl.response && (
                      <span className="text-gray-500 truncate">{wl.response.slice(0, 80)}{wl.response.length > 80 ? '…' : ''}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

interface WebhookFormModalProps {
  token: string
  onClose: () => void
  onCreated: () => void
}

function WebhookFormModal({ token, onClose, onCreated }: WebhookFormModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<WebhookFormData>(INITIAL_WEBHOOK_FORM)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.warning('Nome é obrigatório'); return }
    if (!form.url.trim()) { toast.warning('URL é obrigatória'); return }
    setSubmitting(true)
    try {
      await axios.post(
        '/api/integrations/webhooks/',
        {
          name: form.name.trim(),
          url: form.url.trim(),
          event_type: form.event_type,
          action: form.action.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Webhook criado com sucesso!')
      onCreated()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar webhook')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Webhook</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="webhook-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Notificação Slack"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://hooks.slack.com/..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evento</label>
              <select
                value={form.event_type}
                onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EVENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ação (opcional)</label>
              <input
                type="text"
                value={form.action}
                onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))}
                placeholder="Ex: notify"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            form="webhook-form"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
          >
            {submitting
              ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Criando...</>
              : 'Criar Webhook'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

interface AnnouncementFormModalProps {
  token: string
  onClose: () => void
  onCreated: () => void
}

function AnnouncementFormModal({ token, onClose, onCreated }: AnnouncementFormModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<AnnouncementFormData>(INITIAL_ANNOUNCEMENT_FORM)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.warning('Título é obrigatório'); return }
    if (!form.content.trim()) { toast.warning('Conteúdo é obrigatório'); return }
    if (!form.scheduled_start) { toast.warning('Data de início é obrigatória'); return }
    if (!form.scheduled_end) { toast.warning('Data de término é obrigatória'); return }
    setSubmitting(true)
    try {
      await axios.post(
        '/api/announcements/',
        {
          title: form.title.trim(),
          content: form.content.trim(),
          is_highlight: form.is_highlight,
          scheduled_start: form.scheduled_start,
          scheduled_end: form.scheduled_end,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Anúncio criado com sucesso!')
      onCreated()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar anúncio')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Anúncio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="announcement-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Título do anúncio"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={4}
                placeholder="Mensagem do anúncio..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Início <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_start}
                  onChange={(e) => setForm((p) => ({ ...p, scheduled_start: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Término <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_end}
                  onChange={(e) => setForm((p) => ({ ...p, scheduled_end: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_highlight}
                onChange={(e) => setForm((p) => ({ ...p, is_highlight: e.target.checked }))}
                className="w-4 h-4 text-yellow-500 rounded border-gray-300 focus:ring-yellow-400"
              />
              <span className="text-sm font-medium text-gray-700">Destaque (banner amarelo)</span>
            </label>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            form="announcement-form"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
          >
            {submitting
              ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Criando...</>
              : 'Criar Anúncio'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export function IntegrationsPage({ token }: IntegrationsPageProps) {
  const toast = useToast()
  const [tab, setTab] = useState<TabId>('webhooks')
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingWebhooks, setLoadingWebhooks] = useState(true)
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchWebhooks = useCallback(async () => {
    setLoadingWebhooks(true)
    try {
      const res = await axios.get('/api/integrations/webhooks/', { headers })
      setWebhooks(Array.isArray(res.data) ? res.data : res.data.items ?? [])
    } catch {
      toast.error('Erro ao carregar webhooks')
    } finally {
      setLoadingWebhooks(false)
    }
  }, [token])

  const fetchAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true)
    try {
      const res = await axios.get('/api/announcements/', { headers })
      setAnnouncements(Array.isArray(res.data) ? res.data : res.data.items ?? [])
    } catch {
      toast.error('Erro ao carregar anúncios')
    } finally {
      setLoadingAnnouncements(false)
    }
  }, [token])

  useEffect(() => { fetchWebhooks() }, [fetchWebhooks])
  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const handleWebhookToggled = (id: string, newActive: boolean) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_active: newActive } : w)),
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {showWebhookModal && (
        <WebhookFormModal
          token={token}
          onClose={() => setShowWebhookModal(false)}
          onCreated={fetchWebhooks}
        />
      )}
      {showAnnouncementModal && (
        <AnnouncementFormModal
          token={token}
          onClose={() => setShowAnnouncementModal(false)}
          onCreated={fetchAnnouncements}
        />
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrações</h2>
          <p className="text-gray-500 text-sm mt-0.5">Webhooks e anúncios do sistema</p>
        </div>
        {tab === 'webhooks' ? (
          <button
            onClick={() => setShowWebhookModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex-shrink-0"
          >
            + Novo Webhook
          </button>
        ) : (
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex-shrink-0"
          >
            + Novo Anúncio
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {([
          { id: 'webhooks' as TabId, label: 'Webhooks', icon: '🔗' },
          { id: 'announcements' as TabId, label: 'Anúncios', icon: '📢' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Webhooks tab */}
      {tab === 'webhooks' && (
        loadingWebhooks ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-12" />
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🔗</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum webhook cadastrado</h3>
            <p className="text-gray-400 text-sm">Clique em "+ Novo Webhook" para criar uma integração.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nome', 'URL', 'Evento', 'Ação', 'Status', 'Criado', 'Ações'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w) => (
                  <WebhookRow
                    key={w.id}
                    webhook={w}
                    token={token}
                    onToggled={handleWebhookToggled}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Announcements tab */}
      {tab === 'announcements' && (
        loadingAnnouncements ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-12" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum anúncio cadastrado</h3>
            <p className="text-gray-400 text-sm">Clique em "+ Novo Anúncio" para criar um aviso.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Título', 'Conteúdo', 'Destaque', 'Início', 'Fim', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {announcements.map((a) => {
                  const status = announcementStatus(a)
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]" title={a.content}>
                        {a.content.length > 60 ? `${a.content.slice(0, 60)}…` : a.content}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.is_highlight ? (
                          <span className="text-yellow-500 text-lg">★</span>
                        ) : (
                          <span className="text-gray-300 text-lg">☆</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDate(a.scheduled_start)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDate(a.scheduled_end)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.style}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
