import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface Problem {
  id: string
  title: string
  description: string
  status: string // NOVO | ANALISE | CORRECAO | RESOLVIDO | FECHADO
  impact: string // BAIXO | MEDIO | ALTO | CRITICO
  symptoms?: string
  root_cause?: string
  workaround?: string
  solution?: string
  opened_by_user_id: string
  assigned_to_user_id?: string
  created_at: string
  resolved_at?: string
}

interface ProblemPageProps {
  token: string
}

interface CreateFormData {
  title: string
  description: string
  impact: string
  symptoms: string
}

interface EditFormData {
  status: string
  root_cause: string
  workaround: string
  solution: string
}

const STATUS_STYLES: Record<string, string> = {
  NOVO: 'bg-blue-100 text-blue-800',
  ANALISE: 'bg-yellow-100 text-yellow-800',
  CORRECAO: 'bg-orange-100 text-orange-800',
  RESOLVIDO: 'bg-green-100 text-green-800',
  FECHADO: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  ANALISE: 'Em Análise',
  CORRECAO: 'Em Correção',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
}

const IMPACT_STYLES: Record<string, string> = {
  BAIXO: 'bg-green-100 text-green-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  ALTO: 'bg-orange-100 text-orange-800',
  CRITICO: 'bg-red-100 text-red-800',
}

const IMPACT_LABELS: Record<string, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
}

const FILTER_TABS = ['Todos', 'NOVO', 'ANALISE', 'CORRECAO', 'RESOLVIDO']

const INITIAL_CREATE: CreateFormData = { title: '', description: '', impact: 'MEDIO', symptoms: '' }
const INITIAL_EDIT: EditFormData = { status: '', root_cause: '', workaround: '', solution: '' }

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function ProblemDetailModal({
  problem,
  token,
  onClose,
  onUpdated,
}: {
  problem: Problem
  token: string
  onClose: () => void
  onUpdated: () => void
}) {
  const toast = useToast()
  const [editData, setEditData] = useState<EditFormData>({
    status: problem.status,
    root_cause: problem.root_cause ?? '',
    workaround: problem.workaround ?? '',
    solution: problem.solution ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.patch(
        `/api/problems/${problem.id}`,
        {
          status: editData.status,
          root_cause: editData.root_cause.trim() || undefined,
          workaround: editData.workaround.trim() || undefined,
          solution: editData.solution.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Problema atualizado com sucesso!')
      onUpdated()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao atualizar problema')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap gap-2 mb-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[problem.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[problem.status] ?? problem.status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${IMPACT_STYLES[problem.impact] ?? 'bg-gray-100 text-gray-600'}`}>
                Impacto: {IMPACT_LABELS[problem.impact] ?? problem.impact}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{problem.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Aberto em {formatDate(problem.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descrição</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{problem.description}</p>
          </div>

          {/* Symptoms (read-only) */}
          {problem.symptoms && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sintomas</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{problem.symptoms}</p>
            </div>
          )}

          {problem.resolved_at && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resolvido em</h3>
              <p className="text-sm text-gray-700">{formatDate(problem.resolved_at)}</p>
            </div>
          )}

          {/* Edit form */}
          <form id="problem-edit-form" onSubmit={handleSave} className="space-y-4 border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-800">Atualizar Problema</h3>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editData.status}
                onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Root cause */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Causa Raiz</label>
              <textarea
                value={editData.root_cause}
                onChange={(e) => setEditData((p) => ({ ...p, root_cause: e.target.value }))}
                rows={3}
                placeholder="Descreva a causa raiz identificada..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Workaround */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contorno (Workaround)</label>
              <textarea
                value={editData.workaround}
                onChange={(e) => setEditData((p) => ({ ...p, workaround: e.target.value }))}
                rows={3}
                placeholder="Solução temporária enquanto a causa raiz é tratada..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Solution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Solução Definitiva</label>
              <textarea
                value={editData.solution}
                onChange={(e) => setEditData((p) => ({ ...p, solution: e.target.value }))}
                rows={3}
                placeholder="Solução definitiva aplicada ou planejada..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            form="problem-edit-form"
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
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProblemPage({ token }: ProblemPageProps) {
  const toast = useToast()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateFormData>(INITIAL_CREATE)
  const [activeTab, setActiveTab] = useState('Todos')
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/problems/', { headers })
      const data = response.data
      setProblems(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar problemas. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchProblems() }, [fetchProblems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) { toast.warning('Título é obrigatório'); return }
    if (!formData.description.trim()) { toast.warning('Descrição é obrigatória'); return }
    setSubmitting(true)
    try {
      await axios.post('/api/problems/', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        impact: formData.impact,
        symptoms: formData.symptoms.trim() || undefined,
      }, { headers })
      toast.success('Problema registrado com sucesso!')
      setFormData(INITIAL_CREATE)
      setShowForm(false)
      fetchProblems()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar problema')
    } finally {
      setSubmitting(false)
    }
  }

  const visibleProblems = problems.filter((p) =>
    activeTab === 'Todos' ? true : p.status === activeTab,
  )

  const countByStatus = (status: string) => problems.filter((p) => p.status === status).length

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {selectedProblem && (
        <ProblemDetailModal
          problem={selectedProblem}
          token={token}
          onClose={() => setSelectedProblem(null)}
          onUpdated={fetchProblems}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Problemas</h2>
          <p className="text-gray-500 text-sm mt-0.5">Análise de causa raiz e resolução de problemas recorrentes</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v) }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex-shrink-0"
        >
          {showForm ? '✕ Cancelar' : '+ Novo Problema'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Novo Problema</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Descreva o problema brevemente"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                placeholder="Detalhe o problema observado, frequência e contexto"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impacto</label>
                <select
                  value={formData.impact}
                  onChange={(e) => setFormData((p) => ({ ...p, impact: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BAIXO">Baixo</option>
                  <option value="MEDIO">Médio</option>
                  <option value="ALTO">Alto</option>
                  <option value="CRITICO">Crítico</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sintomas Observados</label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData((p) => ({ ...p, symptoms: e.target.value }))}
                rows={3}
                placeholder="Liste os sintomas observados pelos usuários ou sistemas de monitoramento..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
              >
                {submitting
                  ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Criando...</>
                  : 'Registrar Problema'}
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

      {/* Problem list */}
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
      ) : visibleProblems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {activeTab === 'Todos' ? 'Nenhum problema registrado' : `Nenhum problema com status "${STATUS_LABELS[activeTab]}"`}
          </h3>
          <p className="text-gray-400 text-sm">
            {activeTab === 'Todos'
              ? 'Clique em "+ Novo Problema" para registrar o primeiro.'
              : 'Tente outro filtro de status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{visibleProblems.length} problema(s) encontrado(s)</p>
          {visibleProblems.map((problem) => (
            <div
              key={problem.id}
              onClick={() => setSelectedProblem(problem)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-base">🔧</span>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {problem.title}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{problem.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[problem.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[problem.status] ?? problem.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${IMPACT_STYLES[problem.impact] ?? 'bg-gray-100 text-gray-600'}`}>
                      Impacto: {IMPACT_LABELS[problem.impact] ?? problem.impact}
                    </span>
                    {problem.root_cause && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        Causa raiz identificada
                      </span>
                    )}
                    {problem.workaround && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                        Contorno disponível
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-gray-400">{formatDate(problem.created_at)}</p>
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

// Keep INITIAL_EDIT in scope to avoid lint warnings – used if we later add a reset
void INITIAL_EDIT
