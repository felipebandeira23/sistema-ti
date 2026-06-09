import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface AuditLog {
  id: string
  action: string
  resource_type: string
  resource_id?: string
  user_id?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ip_address?: string
  severity: string
  timestamp: string
}

interface AuditPageProps {
  token: string
}

type PeriodDays = 7 | 30 | 90

const ACTION_BADGE: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  APPROVE: 'bg-teal-100 text-teal-800',
  REJECT: 'bg-red-100 text-red-800',
}

const SEVERITY_BADGE: Record<string, string> = {
  INFO: 'bg-gray-100 text-gray-600',
  WARNING: 'bg-yellow-100 text-yellow-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_BADGE[action] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {action}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const style = SEVERITY_BADGE[severity] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {severity}
    </span>
  )
}

interface ExpandedRowProps {
  log: AuditLog
}

function ExpandedRow({ log }: ExpandedRowProps) {
  const hasDiff = log.before !== undefined || log.after !== undefined
  return (
    <tr className="bg-gray-50">
      <td colSpan={7} className="px-4 py-4">
        <div className="space-y-3">
          {log.ip_address && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">IP:</span> {log.ip_address}
            </p>
          )}
          {hasDiff ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Antes</p>
                <pre className="text-xs bg-red-50 border border-red-100 rounded-lg p-3 overflow-x-auto text-gray-700 whitespace-pre-wrap break-all">
                  {log.before !== undefined ? JSON.stringify(log.before, null, 2) : '—'}
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Depois</p>
                <pre className="text-xs bg-green-50 border border-green-100 rounded-lg p-3 overflow-x-auto text-gray-700 whitespace-pre-wrap break-all">
                  {log.after !== undefined ? JSON.stringify(log.after, null, 2) : '—'}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Sem detalhes de alteração disponíveis.</p>
          )}
        </div>
      </td>
    </tr>
  )
}

export function AuditPage({ token }: AuditPageProps) {
  const toast = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodDays>(30)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { days: period }
      if (actionFilter) params.action = actionFilter
      const res = await axios.get('/api/audit/', { headers, params })
      setLogs(Array.isArray(res.data) ? res.data : res.data.items ?? [])
    } catch {
      toast.error('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }, [token, period, actionFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // Collect unique actions from loaded logs for the filter select
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).sort()

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Log de Auditoria</h2>
          <p className="text-gray-500 text-sm mt-0.5">Registro completo de ações realizadas no sistema</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Period toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            {([7, 30, 90] as PeriodDays[]).map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-3 py-2 transition ${
                  period === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as ações</option>
            {(uniqueActions.length > 0 ? uniqueActions : Object.keys(ACTION_BADGE)).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-12" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Sem registros</h3>
          <p className="text-gray-400 text-sm">Nenhum log encontrado para o período e filtro selecionados.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{logs.length} registro(s) encontrado(s)</p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Data/Hora', 'Ação', 'Recurso', 'ID', 'Usuário', 'Severidade', 'IP'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleExpand(log.id)}
                      className={`border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${
                        expandedId === log.id ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{log.resource_type}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[100px]" title={log.resource_id}>
                        {log.resource_id ? `${log.resource_id.slice(0, 8)}…` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {log.user_id ? `${log.user_id.slice(0, 8)}…` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={log.severity} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{log.ip_address ?? '—'}</td>
                    </tr>
                    {expandedId === log.id && <ExpandedRow log={log} />}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
