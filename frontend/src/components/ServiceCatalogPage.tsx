import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface CatalogCategory {
  id: string
  name: string
  description?: string
}

interface CatalogItem {
  id: string
  name: string
  description?: string
  category_id?: string
  estimated_time?: number
  requires_approval: boolean
  approval_levels?: number
  is_active: boolean
  sla_response_time?: number
  created_at?: string
}

interface ServiceCatalogPageProps {
  token: string
}

const INITIAL_FORM = {
  name: '', description: '', category_id: '',
  estimated_time: 24, requires_approval: false, approval_levels: 1,
  is_active: true, sla_response_time: 8,
}

function formatHours(h?: number) {
  if (!h) return '—'
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  const rem = h % 24
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`
}

export function ServiceCatalogPage({ token }: ServiceCatalogPageProps) {
  const toast = useToast()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(true)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [itemsRes, catRes] = await Promise.allSettled([
        axios.get('/api/catalog/items', { headers }),
        axios.get('/api/catalog/categories', { headers }),
      ])
      if (itemsRes.status === 'fulfilled') {
        const d = itemsRes.value.data
        setItems(Array.isArray(d) ? d : d.items ?? [])
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data ?? [])
      }
    } catch {
      toast.error('Erro ao carregar catálogo de serviços')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.warning('Nome do serviço é obrigatório'); return }
    setSubmitting(true)
    try {
      await axios.post('/api/catalog/items', {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category_id: formData.category_id || undefined,
        estimated_time: formData.estimated_time || undefined,
        requires_approval: formData.requires_approval,
        approval_levels: formData.requires_approval ? formData.approval_levels : undefined,
        is_active: formData.is_active,
        sla_response_time: formData.sla_response_time || undefined,
      }, { headers })
      toast.success('Serviço adicionado ao catálogo!')
      setFormData(INITIAL_FORM)
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao criar serviço')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequest = async (item: CatalogItem) => {
    setRequesting(item.id)
    try {
      await axios.post('/api/tickets/', {
        title: `Solicitação: ${item.name}`,
        description: item.description || `Solicitação de serviço: ${item.name}`,
        type: 'REQUISIÇÃO',
        priority: 'MÉDIA',
        catalog_item_id: item.id,
      }, { headers })
      toast.success(`Solicitação de "${item.name}" criada com sucesso!`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao criar solicitação')
    } finally {
      setRequesting(null)
    }
  }

  const visible = items.filter((item) => {
    const q = search.toLowerCase()
    const matchSearch = !search || item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    const matchCat = !filterCategory || item.category_id === filterCategory
    const matchActive = !showOnlyActive || item.is_active
    return matchSearch && matchCat && matchActive
  })

  const getCategoryName = (id?: string) => categories.find((c) => c.id === id)?.name

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catálogo de Serviços</h2>
          <p className="text-gray-500 text-sm mt-0.5">Solicite serviços de TI disponíveis para os usuários</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm">
          {showForm ? '✕ Cancelar' : '+ Novo Serviço'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Adicionar ao Catálogo</h3>
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Criação de Conta no Active Directory"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select value={formData.category_id}
                  onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Estimado (horas)</label>
                <input type="number" min="1" value={formData.estimated_time}
                  onChange={(e) => setFormData((p) => ({ ...p, estimated_time: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SLA Resposta (horas)</label>
                <input type="number" min="1" value={formData.sla_response_time}
                  onChange={(e) => setFormData((p) => ({ ...p, sla_response_time: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea rows={3} value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descreva o serviço, requisitos e processo..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.requires_approval}
                  onChange={(e) => setFormData((p) => ({ ...p, requires_approval: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Requer aprovação</span>
              </label>
              {formData.requires_approval && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Níveis de aprovação:</label>
                  <input type="number" min="1" max="5" value={formData.approval_levels}
                    onChange={(e) => setFormData((p) => ({ ...p, approval_levels: parseInt(e.target.value) || 1 }))}
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active}
                  onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Disponível para solicitação</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2">
                {submitting ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</> : 'Adicionar ao Catálogo'}
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
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar serviços..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {categories.length > 0 && (
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas as categorias</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 flex-shrink-0">
            <input type="checkbox" checked={showOnlyActive} onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Apenas ativos
          </label>
          {(search || filterCategory) && (
            <button onClick={() => { setSearch(''); setFilterCategory('') }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition flex-shrink-0">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
              <div className="h-9 bg-blue-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search || filterCategory ? 'Nenhum serviço encontrado' : 'Catálogo vazio'}
          </h3>
          <p className="text-gray-400 text-sm">
            {search || filterCategory ? 'Tente outros termos.' : 'Adicione o primeiro serviço ao catálogo.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{visible.length} serviço(s) disponível(is)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((item) => {
              const catName = getCategoryName(item.category_id)
              return (
                <div key={item.id}
                  className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col transition ${
                    item.is_active ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 opacity-70'
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 leading-snug">{item.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {catName && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{catName}</span>
                        )}
                        {item.requires_approval && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                            ✓ {item.approval_levels ?? 1} nível(is) de aprovação
                          </span>
                        )}
                        {!item.is_active && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Indisponível</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                  )}

                  <div className="flex justify-between text-xs text-gray-400 mb-4">
                    {item.estimated_time && (
                      <span>⏱ Prazo estimado: <strong className="text-gray-600">{formatHours(item.estimated_time)}</strong></span>
                    )}
                    {item.sla_response_time && (
                      <span>SLA: <strong className="text-gray-600">{formatHours(item.sla_response_time)}</strong></span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRequest(item)}
                    disabled={!item.is_active || requesting === item.id}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {requesting === item.id ? (
                      <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Solicitando...</>
                    ) : item.is_active ? '📋 Solicitar Serviço' : 'Indisponível'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
