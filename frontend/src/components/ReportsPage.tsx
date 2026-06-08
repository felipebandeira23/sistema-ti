import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface ReportsPageProps {
  token: string
}

interface DashboardSummary {
  totals?: {
    tickets?: number
    assets?: number
    approvals?: number
    problems?: number
    changes?: number
  }
  tickets_by_status?: Record<string, number>
  tickets_by_priority?: Record<string, number>
  sla_distribution?: Record<string, number>
  assets_by_type?: Record<string, number>
  approvals_by_status?: Record<string, number>
}

interface SLAPolicy {
  id: string
  name: string
  description?: string
  ticket_type: string
  priority_level: string
  response_time: number
  resolution_time: number
  is_active: boolean
}

interface Asset {
  id: string
  name: string
  type: string
  status: string
}

type ReportTab = 'overview' | 'tickets' | 'sla' | 'inventory'
type PeriodFilter = '7d' | '30d' | '90d'

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
}

const STATUS_COLORS: Record<string, string> = {
  ABERTO: 'bg-blue-500',
  EM_PROGRESSO: 'bg-purple-500',
  AGUARDANDO_USUARIO: 'bg-orange-500',
  RESOLVIDO: 'bg-teal-500',
  FECHADO: 'bg-green-500',
  CANCELADO: 'bg-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_PROGRESSO: 'Em Progresso',
  AGUARDANDO_USUARIO: 'Aguard. Usuário',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  CANCELADO: 'Cancelado',
}

const PRIORITY_COLORS: Record<string, string> = {
  CRÍTICA: 'bg-red-500',
  ALTA: 'bg-orange-500',
  MÉDIA: 'bg-yellow-500',
  BAIXA: 'bg-green-500',
  CRITICA: 'bg-red-500',
  MEDIA: 'bg-yellow-500',
}

const PRIORITY_LABELS: Record<string, string> = {
  CRÍTICA: 'Crítica',
  ALTA: 'Alta',
  MÉDIA: 'Média',
  BAIXA: 'Baixa',
}

const SLA_COLORS: Record<string, string> = {
  OK: 'bg-green-500',
  CRÍTICO: 'bg-yellow-500',
  EXPIRADO: 'bg-red-500',
}

const PRIORITY_STYLE: Record<string, string> = {
  CRÍTICA: 'bg-red-100 text-red-800 border-red-200',
  ALTA: 'bg-orange-100 text-orange-800 border-orange-200',
  MÉDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  BAIXA: 'bg-green-100 text-green-800 border-green-200',
}

const TYPE_ICONS: Record<string, string> = {
  INCIDENTE: '🚨',
  REQUISICAO: '📋',
  REQUISIÇÃO: '📋',
  PROBLEMA: '🔧',
  MUDANCA: '🔄',
  MUDANÇA: '🔄',
}

function formatHours(h: number): string {
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  const rem = h % 24
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`
}

function getTotal(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, v) => sum + v, 0)
}

function CSSBar({
  label,
  value,
  total,
  colorClass,
  showCount = true,
}: {
  label: string
  value: number
  total: number
  colorClass: string
  showCount?: boolean
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-36 flex-shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-16 text-right flex-shrink-0">
        {showCount ? `${value} (${pct}%)` : `${pct}%`}
      </span>
    </div>
  )
}

function KPICard({
  title,
  value,
  icon,
  trend,
  sub,
}: {
  title: string
  value: number | string
  icon: string
  trend?: 'up' | 'down' | 'neutral'
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'
            }`}>
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} vs. período anterior
            </p>
          )}
        </div>
        <span className="text-3xl opacity-25">{icon}</span>
      </div>
    </div>
  )
}

function SkeletonKPI() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  )
}

// ------- TABS -------

function OverviewTab({ summary, loading }: { summary: DashboardSummary | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonKPI key={i} />)}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-48" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-700">Dados não disponíveis</h3>
        <p className="text-gray-400 text-sm mt-1">Não foi possível carregar o resumo do painel.</p>
      </div>
    )
  }

  const totals = summary.totals ?? {}
  const byStatus = summary.tickets_by_status ?? {}
  const byPriority = summary.tickets_by_priority ?? {}
  const slaDistrib = summary.sla_distribution ?? {}

  const totalTickets = getTotal(byStatus)
  const totalPriority = getTotal(byPriority)
  const totalSLA = getTotal(slaDistrib)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total de Tickets" value={totals.tickets ?? totalTickets} icon="🎫" />
        <KPICard title="Ativos" value={totals.assets ?? 0} icon="📦" />
        <KPICard title="Aprovações Pendentes" value={totals.approvals ?? 0} icon="✅" />
        <KPICard title="Problemas Abertos" value={totals.problems ?? 0} icon="🔧" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tickets por Status</h3>
          {Object.keys(byStatus).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem dados de status</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byStatus).map(([status, count]) => (
                <CSSBar
                  key={status}
                  label={STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
                  value={count}
                  total={totalTickets}
                  colorClass={STATUS_COLORS[status] ?? 'bg-blue-400'}
                />
              ))}
            </div>
          )}
        </div>

        {/* By Priority */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tickets por Prioridade</h3>
          {Object.keys(byPriority).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem dados de prioridade</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byPriority).map(([priority, count]) => (
                <CSSBar
                  key={priority}
                  label={PRIORITY_LABELS[priority] ?? priority}
                  value={count}
                  total={totalPriority}
                  colorClass={PRIORITY_COLORS[priority] ?? 'bg-gray-400'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SLA distribution */}
      {totalSLA > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Distribuição SLA</h3>
          <div className="space-y-3">
            {Object.entries(slaDistrib).map(([key, count]) => (
              <CSSBar
                key={key}
                label={key}
                value={count}
                total={totalSLA}
                colorClass={SLA_COLORS[key] ?? 'bg-gray-400'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TicketsTab({
  summary,
  loading,
  period,
  onPeriodChange,
}: {
  summary: DashboardSummary | null
  loading: boolean
  period: PeriodFilter
  onPeriodChange: (p: PeriodFilter) => void
}) {
  const toast = useToast()

  const handleExport = () => {
    toast.info('Exportando relatório de tickets...')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-40" />
        ))}
      </div>
    )
  }

  const byStatus = summary?.tickets_by_status ?? {}
  const byPriority = summary?.tickets_by_priority ?? {}
  const totalTickets = getTotal(byStatus)

  const typeCountRows = [
    { type: 'INCIDENTE', label: 'Incidentes', icon: '🚨', avg: '4h 20min' },
    { type: 'REQUISIÇÃO', label: 'Requisições', icon: '📋', avg: '2d 3h' },
    { type: 'PROBLEMA', label: 'Problemas', icon: '🔧', avg: '6d 12h' },
    { type: 'MUDANÇA', label: 'Mudanças', icon: '🔄', avg: '10d' },
  ]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 text-sm rounded-md transition font-medium ${
                period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
        >
          ⬇ Exportar
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total no período</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalTickets.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-1">{PERIOD_LABELS[period]}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Resolvidos</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {((byStatus.RESOLVIDO ?? 0) + (byStatus.FECHADO ?? 0)).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Resolvidos + Fechados</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Em aberto</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {((byStatus.ABERTO ?? 0) + (byStatus.EM_PROGRESSO ?? 0)).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Abertos + Em Progresso</p>
        </div>
      </div>

      {/* By ticket type table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Volume por Tipo de Ticket</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Volume</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">% do Total</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Tempo Médio Resolução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {typeCountRows.map((row) => (
                <tr key={row.type} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 font-medium text-gray-900">
                      <span>{row.icon}</span> {row.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">—</td>
                  <td className="px-6 py-4 text-right text-gray-500">—</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{row.avg}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-50 bg-gray-50">
          <p className="text-xs text-gray-400">* Tempo médio de resolução estimado. Dados reais dependem da integração de métricas.</p>
        </div>
      </div>

      {/* Priority breakdown */}
      {Object.keys(byPriority).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Breakdown por Prioridade</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(byPriority).map(([priority, count]) => (
              <div key={priority} className={`rounded-lg border p-4 ${PRIORITY_STYLE[priority] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{PRIORITY_LABELS[priority] ?? priority}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
                <p className="text-xs opacity-60 mt-1">
                  {totalTickets > 0 ? `${Math.round((count / totalTickets) * 100)}% do total` : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SLATab({ token }: { token: string }) {
  const toast = useToast()
  const [policies, setPolicies] = useState<SLAPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const headers = { Authorization: `Bearer ${token}` }

  const fetchPolicies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/sla/', { headers })
      const data = res.data
      setPolicies(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar políticas SLA')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchPolicies() }, [fetchPolicies])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-32" />
        ))}
      </div>
    )
  }

  if (policies.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">⏱️</div>
        <h3 className="text-lg font-semibold text-gray-700">Nenhuma política SLA configurada</h3>
        <p className="text-gray-400 text-sm mt-1">Configure as políticas de SLA na seção de SLA.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{policies.length} política(s) SLA configurada(s)</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Políticas de SLA e Conformidade</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Política</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo / Prioridade</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Tempo de Resposta</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Tempo de Resolução</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{policy.name}</p>
                    {policy.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{policy.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full w-fit font-medium">
                        {TYPE_ICONS[policy.ticket_type] ?? '🎫'} {policy.ticket_type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full w-fit font-medium border ${PRIORITY_STYLE[policy.priority_level] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        {policy.priority_level}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-gray-900">{formatHours(policy.response_time)}</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((policy.response_time / policy.resolution_time) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-gray-900">{formatHours(policy.resolution_time)}</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      policy.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {policy.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Meta de Conformidade', value: '95%', color: 'text-green-600', bg: 'bg-green-50', icon: '🎯' },
          { label: 'Políticas Ativas', value: `${policies.filter((p) => p.is_active).length}/${policies.length}`, color: 'text-blue-600', bg: 'bg-blue-50', icon: '✅' },
          { label: 'Menor Tempo Resposta', value: formatHours(Math.min(...policies.map((p) => p.response_time))), color: 'text-purple-600', bg: 'bg-purple-50', icon: '⚡' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border border-gray-100 p-5 ${item.bg}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InventoryTab({ token }: { token: string }) {
  const toast = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const headers = { Authorization: `Bearer ${token}` }

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/assets/', { headers, params: { limit: 100 } })
      const data = res.data
      setAssets(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar inventário')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-40" />
        ))}
      </div>
    )
  }

  // Compute type distribution
  const byType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  assets.forEach((a) => {
    byType[a.type] = (byType[a.type] ?? 0) + 1
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1
  })
  const totalAssets = assets.length

  const typeColorPalette = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500',
    'bg-orange-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
  ]

  const statusColorMap: Record<string, string> = {
    ATIVO: 'bg-green-500',
    INATIVO: 'bg-gray-400',
    EM_MANUTENCAO: 'bg-yellow-500',
    DESCARTADO: 'bg-red-500',
    RESERVADO: 'bg-blue-500',
    EMPRESTADO: 'bg-purple-500',
  }

  const statusLabelMap: Record<string, string> = {
    ATIVO: 'Ativo',
    INATIVO: 'Inativo',
    EM_MANUTENCAO: 'Em Manutenção',
    DESCARTADO: 'Descartado',
    RESERVADO: 'Reservado',
    EMPRESTADO: 'Emprestado',
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total de Ativos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalAssets.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Tipos Distintos</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{Object.keys(byType).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Ativos em Uso</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{byStatus.ATIVO ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Em Manutenção</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{byStatus.EM_MANUTENCAO ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By type chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Distribuição por Tipo</h3>
          {Object.keys(byType).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum ativo encontrado</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count], idx) => (
                  <CSSBar
                    key={type}
                    label={type}
                    value={count}
                    total={totalAssets}
                    colorClass={typeColorPalette[idx % typeColorPalette.length]}
                  />
                ))}
            </div>
          )}
        </div>

        {/* By status chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Distribuição por Status</h3>
          {Object.keys(byStatus).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum ativo encontrado</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <CSSBar
                    key={status}
                    label={statusLabelMap[status] ?? status.replace(/_/g, ' ')}
                    value={count}
                    total={totalAssets}
                    colorClass={statusColorMap[status] ?? 'bg-gray-400'}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Top types table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Detalhe por Tipo de Ativo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Quantidade</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">% do Total</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribuição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(byType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count], idx) => {
                  const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0
                  return (
                    <tr key={type} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">📦 {type}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{count}</td>
                      <td className="px-6 py-4 text-right text-gray-500">{pct}%</td>
                      <td className="px-6 py-4">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${typeColorPalette[idx % typeColorPalette.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ------- MAIN COMPONENT -------

export function ReportsPage({ token }: ReportsPageProps) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [period, setPeriod] = useState<PeriodFilter>('30d')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const res = await axios.get('/api/dashboard/summary', { headers })
      setSummary(res.data)
    } catch {
      toast.error('Erro ao carregar dados do painel')
    } finally {
      setLoadingSummary(false)
    }
  }, [token])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  const tabs: { id: ReportTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'tickets', label: 'Tickets', icon: '🎫' },
    { id: 'sla', label: 'SLA', icon: '⏱️' },
    { id: 'inventory', label: 'Inventário', icon: '📦' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios & Analytics</h2>
          <p className="text-gray-500 text-sm mt-0.5">Visão consolidada do desempenho do suporte TI</p>
        </div>
        <button
          onClick={fetchSummary}
          disabled={loadingSummary}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition text-sm font-medium"
        >
          {loadingSummary
            ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />Atualizando...</>
            : '🔄 Atualizar'}
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab summary={summary} loading={loadingSummary} />
      )}
      {activeTab === 'tickets' && (
        <TicketsTab summary={summary} loading={loadingSummary} period={period} onPeriodChange={setPeriod} />
      )}
      {activeTab === 'sla' && (
        <SLATab token={token} />
      )}
      {activeTab === 'inventory' && (
        <InventoryTab token={token} />
      )}
    </div>
  )
}
