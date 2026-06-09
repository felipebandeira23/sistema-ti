import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface SLAPolicy {
  id: string
  name: string
  description?: string
  ticket_type: string
  priority_level: string
  response_time: number
  resolution_time: number
  is_active: boolean
  created_at?: string
}

interface Calendar {
  id: string
  name: string
  timezone: string
  work_hours_start: string
  work_hours_end: string
  work_days: string[]
}

interface SLAPageProps {
  token: string
}

const TICKET_TYPES = ['INCIDENTE', 'REQUISIÇÃO', 'PROBLEMA', 'MUDANÇA']
const PRIORITIES = ['CRÍTICA', 'ALTA', 'MÉDIA', 'BAIXA']

const PRIORITY_STYLES: Record<string, string> = {
  CRÍTICA: 'bg-red-100 text-red-800 border-red-200',
  ALTA: 'bg-orange-100 text-orange-800 border-orange-200',
  MÉDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  BAIXA: 'bg-green-100 text-green-800 border-green-200',
}

const TYPE_ICONS: Record<string, string> = {
  INCIDENTE: '🚨',
  'REQUISIÇÃO': '📋',
  PROBLEMA: '🔧',
  'MUDANÇA': '🔄',
}

const DAYS_MAP: Record<string, string> = {
  MON: 'Seg', TUE: 'Ter', WED: 'Qua', THU: 'Qui', FRI: 'Sex', SAT: 'Sáb', SUN: 'Dom',
}

const INITIAL_FORM = {
  name: '', description: '', ticket_type: 'INCIDENTE', priority_level: 'MÉDIA',
  response_time: 4, resolution_time: 24, is_active: true,
}

function formatHours(h: number) {
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  const rem = h % 24
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`
}

export function SLAPage({ token }: SLAPageProps) {
  const toast = useToast()
  const [policies, setPolicies] = useState<SLAPolicy[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'policies' | 'calendars'>('policies')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [filterType, setFilterType] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [recalculating, setRecalculating] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [polRes, calRes] = await Promise.allSettled([
        axios.get('/api/sla/', { headers }),
        axios.get('/api/sla/calendars', { headers }),
      ])
      if (polRes.status === 'fulfilled') {
        const d = polRes.value.data
        setPolicies(Array.isArray(d) ? d : d.items ?? [])
      }
      if (calRes.status === 'fulfilled') {
        setCalendars(calRes.value.data ?? [])
      }
    } catch {
      toast.error('Erro ao carregar configurações de SLA')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.warning('Nome da política é obrigatório'); return }
    if (formData.response_time <= 0 || formData.resolution_time <= 0) { toast.warning('Tempos devem ser maiores que zero'); return }
    if (formData.response_time >= formData.resolution_time) { toast.warning('Tempo de resposta deve ser menor que o de resolução'); return }
    setSubmitting(true)
    try {
      await axios.post('/api/sla/', {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        ticket_type: formData.ticket_type,
        priority_level: formData.priority_level,
        response_time: formData.response_time,
        resolution_time: formData.resolution_time,
        is_active: formData.is_active,
      }, { headers })
      toast.success('Política SLA criada com sucesso!')
      setFormData(INITIAL_FORM)
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao criar política SLA')
    } finally {
      setSubmitting(false)
    }
  }

  const recalculate = async () => {
    setRecalculating(true)
    try {
      const res = await axios.post('/api/sla/recalculate', {}, { headers })
      toast.success(`SLA recalculado: ${res.data?.updated ?? 0} ticket(s) atualizados`)
    } catch {
      toast.error('Erro ao recalcular SLA')
    } finally {
      setRecalculating(false)
    }
  }

  const visiblePolicies = policies.filter((p) => {
    const matchType = !filterType || p.ticket_type === filterType
    const matchPriority = !filterPriority || p.priority_level === filterPriority
    return matchType && matchPriority
  })

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SLA — Service Level Agreement</h2>
          <p className="text-gray-500 text-sm mt-0.5">Políticas de tempo de resposta e resolução por tipo e prioridade</p>
        </div>
        <div className="flex gap-2">
          <button onClick={recalculate} disabled={recalculating}
            className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2">
            {recalculating ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />Calculando...</> : '🔄 Recalcular'}
          </button>
          {tab === 'policies' && (
            <button onClick={() => setShowForm((v) => !v)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm">
              {showForm ? '✕ Cancelar' : '+ Nova Política'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {[{ value: 'policies', label: '📋 Políticas SLA' }, { value: 'calendars', label: '📅 Calendários' }].map((t) => (
          <button key={t.value} onClick={() => setTab(t.value as any)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === t.value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'policies' && (
        <>
          {/* New Policy Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-5">Nova Política SLA</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ex: SLA Incidente Crítico"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ticket</label>
                    <select value={formData.ticket_type}
                      onChange={(e) => setFormData((p) => ({ ...p, ticket_type: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {TICKET_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select value={formData.priority_level}
                      onChange={(e) => setFormData((p) => ({ ...p, priority_level: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Resposta (horas)</label>
                    <input type="number" min="1" value={formData.response_time}
                      onChange={(e) => setFormData((p) => ({ ...p, response_time: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Resolução (horas)</label>
                    <input type="number" min="1" value={formData.resolution_time}
                      onChange={(e) => setFormData((p) => ({ ...p, resolution_time: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_active}
                        onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Política ativa</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea rows={2} value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Descrição opcional da política..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2">
                    {submitting ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</> : 'Criar Política'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setFormData(INITIAL_FORM) }}
                    className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos os tipos</option>
                {TICKET_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas as prioridades</option>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
              {(filterType || filterPriority) && (
                <button onClick={() => { setFilterType(''); setFilterPriority('') }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition">
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Policy grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : visiblePolicies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">⏱️</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma política SLA configurada</h3>
              <p className="text-gray-400 text-sm">Crie políticas para definir os prazos de atendimento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visiblePolicies.map((policy) => (
                <div key={policy.id}
                  className={`bg-white rounded-xl shadow-sm border p-6 transition hover:shadow-md ${!policy.is_active ? 'opacity-60' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                          {TYPE_ICONS[policy.ticket_type] ?? '🎫'} {policy.ticket_type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${PRIORITY_STYLES[policy.priority_level] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {policy.priority_level}
                        </span>
                        {!policy.is_active && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Inativa</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600">⚡ Tempo de Resposta</span>
                        <span className="font-bold text-gray-900">{formatHours(policy.response_time)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((policy.response_time / policy.resolution_time) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600">🎯 Tempo de Resolução</span>
                        <span className="font-bold text-gray-900">{formatHours(policy.resolution_time)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  {policy.description && (
                    <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">{policy.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'calendars' && (
        <div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : calendars.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum calendário configurado</h3>
              <p className="text-gray-400 text-sm">Os calendários definem horários de trabalho para cálculo de SLA.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calendars.map((cal) => (
                <div key={cal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-900 mb-4">📅 {cal.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fuso horário</span>
                      <span className="font-medium text-gray-700">{cal.timezone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Horário de trabalho</span>
                      <span className="font-medium text-gray-700">
                        {cal.work_hours_start?.slice(0, 5)} – {cal.work_hours_end?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Dias de trabalho</span>
                      <div className="flex gap-1">
                        {(cal.work_days ?? []).map((d) => (
                          <span key={d} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            {DAYS_MAP[d] ?? d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
