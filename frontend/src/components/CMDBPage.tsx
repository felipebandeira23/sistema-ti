import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface ConfigItem {
  id: string
  name: string
  ci_type: string
  status: string
  description?: string
  version?: string
  ip_address?: string
  hostname?: string
  location?: string
  owner_id?: string
  created_at?: string
  updated_at?: string
}

interface CMDBPageProps {
  token: string
}

const CI_TYPE_ICONS: Record<string, string> = {
  HARDWARE: '💻',
  SOFTWARE: '📦',
  SERVICE: '⚙️',
  NETWORK: '🌐',
  DATABASE: '🗄️',
  APPLICATION: '📱',
  INFRASTRUCTURE: '🏗️',
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  ATIVO: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  INATIVO: 'bg-gray-100 text-gray-600',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  MANUTENÇÃO: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-red-100 text-red-800',
  APOSENTADO: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  ATIVO: 'Ativo',
  INACTIVE: 'Inativo',
  INATIVO: 'Inativo',
  MAINTENANCE: 'Manutenção',
  MANUTENÇÃO: 'Manutenção',
  RETIRED: 'Aposentado',
  APOSENTADO: 'Aposentado',
}

const INITIAL_FORM = {
  name: '', ci_type: 'HARDWARE', status: 'ACTIVE', description: '',
  version: '', ip_address: '', hostname: '', location: '',
}

export function CMDBPage({ token }: CMDBPageProps) {
  const toast = useToast()
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedItem, setSelectedItem] = useState<ConfigItem | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/cmdb/cis', { headers })
      const data = res.data
      setItems(Array.isArray(data) ? data : data.items ?? [])
    } catch {
      toast.error('Erro ao carregar itens de configuração')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.warning('Nome do item é obrigatório'); return }
    setSubmitting(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '')
      )
      await axios.post('/api/cmdb/cis', payload, { headers })
      toast.success('Item de configuração criado!')
      setFormData(INITIAL_FORM)
      setShowForm(false)
      fetchItems()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao criar item')
    } finally {
      setSubmitting(false)
    }
  }

  const visible = items.filter((item) => {
    const q = search.toLowerCase()
    const matchSearch = !search || item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) || item.hostname?.toLowerCase().includes(q) ||
      item.ip_address?.toLowerCase().includes(q)
    const matchType = !filterType || item.ci_type === filterType
    const matchStatus = !filterStatus || item.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CI_TYPE_ICONS[selectedItem.ci_type] ?? '⚙️'}</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedItem.name}</h3>
                  <p className="text-sm text-gray-500">{selectedItem.ci_type}</p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[selectedItem.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[selectedItem.status] ?? selectedItem.status}
                </span>
              </div>
              {selectedItem.version && <div className="flex justify-between"><span className="text-sm text-gray-500">Versão</span><span className="text-sm font-medium text-gray-700 font-mono">{selectedItem.version}</span></div>}
              {selectedItem.hostname && <div className="flex justify-between"><span className="text-sm text-gray-500">Hostname</span><span className="text-sm font-mono text-gray-700">{selectedItem.hostname}</span></div>}
              {selectedItem.ip_address && <div className="flex justify-between"><span className="text-sm text-gray-500">IP</span><span className="text-sm font-mono text-gray-700">{selectedItem.ip_address}</span></div>}
              {selectedItem.location && <div className="flex justify-between"><span className="text-sm text-gray-500">Localização</span><span className="text-sm text-gray-700">{selectedItem.location}</span></div>}
              {selectedItem.description && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Descrição</p>
                  <p className="text-sm text-gray-700">{selectedItem.description}</p>
                </div>
              )}
              {selectedItem.created_at && (
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Criado em</span>
                  <span className="text-xs text-gray-400">{new Date(selectedItem.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CMDB</h2>
          <p className="text-gray-500 text-sm mt-0.5">Configuration Management Database — Itens de configuração e relacionamentos</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm">
          {showForm ? '✕ Cancelar' : '+ Novo Item'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Novo Item de Configuração</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Servidor Web Principal"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={formData.ci_type}
                  onChange={(e) => setFormData((p) => ({ ...p, ci_type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="HARDWARE">💻 Hardware</option>
                  <option value="SOFTWARE">📦 Software</option>
                  <option value="SERVICE">⚙️ Serviço</option>
                  <option value="NETWORK">🌐 Rede</option>
                  <option value="DATABASE">🗄️ Banco de Dados</option>
                  <option value="APPLICATION">📱 Aplicação</option>
                  <option value="INFRASTRUCTURE">🏗️ Infraestrutura</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="MAINTENANCE">Manutenção</option>
                  <option value="RETIRED">Aposentado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Versão</label>
                <input type="text" value={formData.version}
                  onChange={(e) => setFormData((p) => ({ ...p, version: e.target.value }))}
                  placeholder="Ex: 1.0.0"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                <input type="text" value={formData.hostname}
                  onChange={(e) => setFormData((p) => ({ ...p, hostname: e.target.value }))}
                  placeholder="servidor-web-01"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço IP</label>
                <input type="text" value={formData.ip_address}
                  onChange={(e) => setFormData((p) => ({ ...p, ip_address: e.target.value }))}
                  placeholder="10.0.0.10"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input type="text" value={formData.location}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Ex: Datacenter Bloco A, Rack 3"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea rows={2} value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Descrição do item de configuração..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2">
                {submitting ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</> : 'Criar Item'}
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
            placeholder="🔍 Buscar por nome, hostname, IP..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os tipos</option>
            {['HARDWARE', 'SOFTWARE', 'SERVICE', 'NETWORK', 'DATABASE', 'APPLICATION', 'INFRASTRUCTURE'].map((t) => (
              <option key={t} value={t}>{CI_TYPE_ICONS[t]} {t}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="MAINTENANCE">Manutenção</option>
            <option value="RETIRED">Aposentado</option>
          </select>
          {(search || filterType || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus('') }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-12 bg-gray-50 border-b border-gray-100" />
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 border-b border-gray-50 mx-6 flex items-center"><div className="h-4 bg-gray-100 rounded w-full" /></div>)}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">⚙️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search || filterType || filterStatus ? 'Nenhum item encontrado' : 'CMDB vazio'}
          </h3>
          <p className="text-gray-400 text-sm">
            {search || filterType || filterStatus ? 'Ajuste os filtros.' : 'Cadastre o primeiro item de configuração.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{visible.length} item(ns)</p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Hostname / IP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Localização</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => setSelectedItem(item)}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{CI_TYPE_ICONS[item.ci_type] ?? '⚙️'}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.version && <p className="text-xs text-gray-400 font-mono">v{item.version}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{item.ci_type}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="text-xs font-mono text-gray-600 space-y-0.5">
                          {item.hostname && <p>{item.hostname}</p>}
                          {item.ip_address && <p className="text-gray-400">{item.ip_address}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500">{item.location ?? '—'}</td>
                      <td className="px-4 py-3.5 text-gray-300 hover:text-blue-400 transition text-lg">›</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
