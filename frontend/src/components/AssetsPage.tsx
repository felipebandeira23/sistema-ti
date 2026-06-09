import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface Asset {
  id: string
  name: string
  asset_type: string
  status: string
  serial_number?: string
  manufacturer?: string
  model?: string
  hostname?: string
  ip_address?: string
  description?: string
  created_at?: string
}

interface AssetsPageProps {
  token: string
}

const TYPE_ICONS: Record<string, string> = {
  HARDWARE: '💻',
  SOFTWARE: '📦',
  SERVIDOR: '🖥️',
  SERVER: '🖥️',
  REDE: '🌐',
  NETWORK: '🌐',
  PERIFÉRICO: '🖱️',
  PERIPHERAL: '🖱️',
  MÓVEL: '📱',
  CONSUMÍVEL: '📄',
}

const STATUS_STYLES: Record<string, string> = {
  DISPONÍVEL: 'bg-green-100 text-green-800',
  AVAILABLE: 'bg-green-100 text-green-800',
  EM_USO: 'bg-blue-100 text-blue-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MANUTENÇÃO: 'bg-yellow-100 text-yellow-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  APOSENTADO: 'bg-red-100 text-red-800',
  RETIRED: 'bg-red-100 text-red-800',
  DESCARTADO: 'bg-gray-100 text-gray-600',
  DISPOSED: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<string, string> = {
  DISPONÍVEL: 'Disponível',
  AVAILABLE: 'Disponível',
  EM_USO: 'Em Uso',
  IN_USE: 'Em Uso',
  MANUTENÇÃO: 'Manutenção',
  MAINTENANCE: 'Manutenção',
  APOSENTADO: 'Aposentado',
  RETIRED: 'Aposentado',
  DESCARTADO: 'Descartado',
  DISPOSED: 'Descartado',
}

const INITIAL_FORM = {
  name: '', asset_type: 'HARDWARE', serial_number: '', manufacturer: '',
  model: '', hostname: '', ip_address: '', description: '', status: 'DISPONÍVEL',
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  )
}

export function AssetsPage({ token }: AssetsPageProps) {
  const toast = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterType) params.asset_type = filterType
      if (filterStatus) params.status = filterStatus
      const res = await axios.get('/api/assets/', { headers, params })
      const data = res.data
      setAssets(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar inventário')
    } finally {
      setLoading(false)
    }
  }, [token, filterType, filterStatus])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.warning('Nome do ativo é obrigatório')
      return
    }
    setSubmitting(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '')
      )
      await axios.post('/api/assets/', payload, { headers })
      toast.success('Ativo cadastrado com sucesso!')
      setFormData(INITIAL_FORM)
      setShowForm(false)
      fetchAssets()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao cadastrar ativo')
    } finally {
      setSubmitting(false)
    }
  }

  const visible = assets.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.serial_number?.toLowerCase().includes(q) ||
      a.hostname?.toLowerCase().includes(q) ||
      a.manufacturer?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventário de Ativos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Hardware, software e infraestrutura</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          {showForm ? '✕ Cancelar' : '+ Novo Ativo'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Cadastrar Novo Ativo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
                <input
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Notebook Dell Latitude"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData((p) => ({ ...p, asset_type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HARDWARE">💻 Hardware</option>
                  <option value="SOFTWARE">📦 Software</option>
                  <option value="SERVIDOR">🖥️ Servidor</option>
                  <option value="REDE">🌐 Rede</option>
                  <option value="PERIFÉRICO">🖱️ Periférico</option>
                  <option value="MÓVEL">📱 Móvel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante</label>
                <input type="text" value={formData.manufacturer}
                  onChange={(e) => setFormData((p) => ({ ...p, manufacturer: e.target.value }))}
                  placeholder="Ex: Dell, HP, Lenovo"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <input type="text" value={formData.model}
                  onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
                  placeholder="Ex: Latitude 5420"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série</label>
                <input type="text" value={formData.serial_number}
                  onChange={(e) => setFormData((p) => ({ ...p, serial_number: e.target.value }))}
                  placeholder="SN1234567890"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DISPONÍVEL">Disponível</option>
                  <option value="EM_USO">Em Uso</option>
                  <option value="MANUTENÇÃO">Manutenção</option>
                  <option value="APOSENTADO">Aposentado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                <input type="text" value={formData.hostname}
                  onChange={(e) => setFormData((p) => ({ ...p, hostname: e.target.value }))}
                  placeholder="pc-usuario-01"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço IP</label>
                <input type="text" value={formData.ip_address}
                  onChange={(e) => setFormData((p) => ({ ...p, ip_address: e.target.value }))}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea rows={2} value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Observações adicionais..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2">
                {submitting ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</> : 'Cadastrar Ativo'}
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
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por nome, serial, hostname..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os tipos</option>
            <option value="HARDWARE">Hardware</option>
            <option value="SOFTWARE">Software</option>
            <option value="SERVIDOR">Servidor</option>
            <option value="REDE">Rede</option>
            <option value="PERIFÉRICO">Periférico</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os status</option>
            <option value="DISPONÍVEL">Disponível</option>
            <option value="EM_USO">Em Uso</option>
            <option value="MANUTENÇÃO">Manutenção</option>
            <option value="APOSENTADO">Aposentado</option>
          </select>
          {(filterType || filterStatus || search) && (
            <button onClick={() => { setFilterType(''); setFilterStatus(''); setSearch('') }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search || filterType || filterStatus ? 'Nenhum ativo encontrado' : 'Nenhum ativo cadastrado'}
          </h3>
          <p className="text-gray-400 text-sm">
            {search || filterType || filterStatus ? 'Ajuste os filtros.' : 'Clique em "+ Novo Ativo" para começar.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{visible.length} ativo(s)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((asset) => (
              <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {TYPE_ICONS[asset.asset_type] ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{asset.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{asset.asset_type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_STYLES[asset.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[asset.status] ?? asset.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  {asset.manufacturer && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fabricante</span>
                      <span className="font-medium text-gray-700">{asset.manufacturer}</span>
                    </div>
                  )}
                  {asset.model && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Modelo</span>
                      <span className="font-medium text-gray-700">{asset.model}</span>
                    </div>
                  )}
                  {asset.serial_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Serial</span>
                      <span className="font-mono text-xs text-gray-700">{asset.serial_number}</span>
                    </div>
                  )}
                  {asset.hostname && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hostname</span>
                      <span className="font-mono text-xs text-gray-700">{asset.hostname}</span>
                    </div>
                  )}
                  {asset.ip_address && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">IP</span>
                      <span className="font-mono text-xs text-gray-700">{asset.ip_address}</span>
                    </div>
                  )}
                </div>
                {asset.description && (
                  <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 line-clamp-2">{asset.description}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
