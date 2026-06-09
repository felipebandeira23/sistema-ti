import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

interface Announcement {
  id: string
  title: string
  content: string
  is_highlight: boolean
  scheduled_start: string
  scheduled_end: string
}

interface DashboardData {
  totals: { tickets: number; assets: number; approvals: number }
  tickets_by_status: Record<string, number>
  tickets_by_priority: Record<string, number>
  sla_distribution: Record<string, number>
  assets_by_type: Record<string, number>
  approvals_by_status: Record<string, number>
}

const PRIORITY_COLORS: Record<string, string> = {
  CRÍTICA: 'bg-red-500',
  ALTA: 'bg-orange-500',
  MÉDIA: 'bg-yellow-500',
  BAIXA: 'bg-green-500',
}

const SLA_COLORS: Record<string, string> = {
  OK: 'text-green-600',
  CRÍTICO: 'text-yellow-600',
  EXPIRADO: 'text-red-600',
}

const quickLinks = [
  { label: 'Novo Ticket', to: '/tickets', icon: '🎫', color: 'bg-blue-50 hover:bg-blue-100' },
  { label: 'Inventário', to: '/assets', icon: '📦', color: 'bg-green-50 hover:bg-green-100' },
  { label: 'Base de Conhecimento', to: '/knowledge', icon: '📚', color: 'bg-purple-50 hover:bg-purple-100' },
  { label: 'Catálogo', to: '/catalog', icon: '📋', color: 'bg-yellow-50 hover:bg-yellow-100' },
  { label: 'Aprovações', to: '/approvals', icon: '✅', color: 'bg-pink-50 hover:bg-pink-100' },
  { label: 'SLA', to: '/sla', icon: '⏱️', color: 'bg-indigo-50 hover:bg-indigo-100' },
]

function StatCard({ title, value, icon, sub }: { title: string; value: number; icon: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString('pt-BR')}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <span className="text-3xl opacity-30">{icon}</span>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

function AnnouncementsBanner({ token }: { token: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('dismissed_announcements')
      return stored ? new Set<string>(JSON.parse(stored) as string[]) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await axios.get('/api/announcements/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: Announcement[] = Array.isArray(res.data) ? res.data : res.data.items ?? []
      setAnnouncements(data)
    } catch {
      // silent
    }
  }, [token])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        sessionStorage.setItem('dismissed_announcements', JSON.stringify(Array.from(next)))
      } catch { /* ignore */ }
      return next
    })
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {visible.map((a) => (
        <div
          key={a.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
            a.is_highlight
              ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span className="text-xl flex-shrink-0 mt-0.5">{a.is_highlight ? '📢' : 'ℹ️'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{a.title}</p>
            <p className="text-sm mt-0.5 opacity-90">{a.content}</p>
          </div>
          <button
            onClick={() => dismiss(a.id)}
            className={`flex-shrink-0 text-lg leading-none opacity-60 hover:opacity-100 transition ${
              a.is_highlight ? 'text-yellow-700' : 'text-blue-700'
            }`}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export function InternalDashboard() {
  const { token, user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!token) return
    axios
      .get('/api/dashboard/summary', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        setData(r.data)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  const openTickets = data
    ? Object.entries(data.tickets_by_status)
        .filter(([s]) => !['FECHADO', 'CANCELADO', 'RESOLVIDO'].includes(s))
        .reduce((acc, [, v]) => acc + v, 0)
    : 0

  const overdueTickets = data?.sla_distribution?.EXPIRADO ?? 0

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Announcements */}
      {token && <AnnouncementsBanner token={token} />}

      {/* Saudação */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.full_name?.split(' ')[0]}!
        </h2>
        <p className="text-gray-500 mt-1">Visão geral do sistema ITSM · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : error ? (
          <div className="col-span-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            Não foi possível carregar métricas. Verifique a conexão com o backend.
          </div>
        ) : data ? (
          <>
            <StatCard title="Total de Tickets" value={data.totals.tickets} icon="🎫" />
            <StatCard title="Tickets Abertos" value={openTickets} icon="📂" sub="não resolvidos" />
            <StatCard title="Tickets Vencidos" value={overdueTickets} icon="⏰" sub="SLA expirado" />
            <StatCard title="Ativos Cadastrados" value={data.totals.assets} icon="📦" />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tickets por prioridade */}
        {data && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Tickets por Prioridade</h3>
            {Object.entries(data.tickets_by_priority).length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.tickets_by_priority).map(([priority, count]) => {
                  const total = Object.values(data.tickets_by_priority).reduce((a, b) => a + b, 0)
                  const pct = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div key={priority}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{priority}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${PRIORITY_COLORS[priority] ?? 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tickets por status */}
        {data && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Tickets por Status</h3>
            {Object.entries(data.tickets_by_status).length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.tickets_by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{status.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-semibold bg-gray-100 px-2 py-0.5 rounded">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SLA Status */}
        {data && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Status SLA</h3>
            {Object.entries(data.sla_distribution).length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados de SLA</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(data.sla_distribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${SLA_COLORS[status] ?? 'text-gray-600'}`}>
                      {status}
                    </span>
                    <span className="text-2xl font-bold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            )}
            {overdueTickets > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-xs font-medium text-red-700">
                  ⚠️ {overdueTickets} ticket(s) com SLA expirado
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acesso rápido */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition ${item.color}`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
