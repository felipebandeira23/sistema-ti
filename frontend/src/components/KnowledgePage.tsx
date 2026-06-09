import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface Category {
  id: string
  name: string
  description?: string
}

interface Article {
  id: string
  title: string
  slug: string
  content?: string
  summary?: string
  is_published: boolean
  visibility: string
  category_id?: string
  view_count?: number
  helpful_count?: number
  not_helpful_count?: number
  created_at?: string
  updated_at?: string
}

interface KnowledgePageProps {
  token: string
}

const INITIAL_FORM = {
  title: '', content: '', summary: '', category_id: '', visibility: 'PUBLIC', is_published: false,
}

function ArticleModal({ article, onClose, token }: { article: Article; onClose: () => void; token: string }) {
  const toast = useToast()
  const headers = { Authorization: `Bearer ${token}` }

  const sendFeedback = async (helpful: boolean) => {
    try {
      await axios.post(`/api/knowledge/articles/${article.id}/feedback`, { helpful }, { headers })
      toast.success(helpful ? 'Obrigado pelo feedback positivo!' : 'Feedback registrado')
    } catch {
      toast.error('Erro ao registrar feedback')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-gray-900">{article.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              {article.is_published && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Publicado</span>
              )}
              <span className="text-xs text-gray-400">
                {article.view_count ?? 0} visualizações
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {article.summary && (
            <p className="text-gray-600 italic border-l-4 border-blue-300 pl-4 mb-4">{article.summary}</p>
          )}
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {article.content || <span className="text-gray-400">Sem conteúdo disponível.</span>}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-sm text-gray-600 mb-3">Este artigo foi útil?</p>
          <div className="flex gap-3">
            <button onClick={() => sendFeedback(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition">
              👍 Sim, ajudou! {article.helpful_count ? `(${article.helpful_count})` : ''}
            </button>
            <button onClick={() => sendFeedback(false)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition">
              👎 Não ajudou {article.not_helpful_count ? `(${article.not_helpful_count})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function KnowledgePage({ token }: KnowledgePageProps) {
  const toast = useToast()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [articlesRes, catRes] = await Promise.allSettled([
        axios.get('/api/knowledge/articles/', { headers }),
        axios.get('/api/knowledge/categories', { headers }),
      ])
      if (articlesRes.status === 'fulfilled') {
        const d = articlesRes.value.data
        setArticles(Array.isArray(d) ? d : d.items ?? [])
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data ?? [])
      }
    } catch {
      toast.error('Erro ao carregar base de conhecimento')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.warning('Título e conteúdo são obrigatórios')
      return
    }
    setSubmitting(true)
    try {
      await axios.post('/api/knowledge/articles/', {
        title: formData.title.trim(),
        content: formData.content.trim(),
        summary: formData.summary.trim() || undefined,
        category_id: formData.category_id || undefined,
        visibility: formData.visibility,
        is_published: formData.is_published,
      }, { headers })
      toast.success('Artigo criado com sucesso!')
      setFormData(INITIAL_FORM)
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao criar artigo')
    } finally {
      setSubmitting(false)
    }
  }

  const visible = articles.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !search || a.title.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q)
    const matchCat = !filterCategory || a.category_id === filterCategory
    return matchSearch && matchCat
  })

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} token={token} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Base de Conhecimento</h2>
          <p className="text-gray-500 text-sm mt-0.5">Artigos, guias e soluções para problemas comuns</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm">
          {showForm ? '✕ Cancelar' : '+ Novo Artigo'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Novo Artigo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
              <input type="text" value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Como resetar senha no LDAP"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resumo</label>
              <input type="text" value={formData.summary}
                onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Breve descrição do artigo (aparece na listagem)"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo <span className="text-red-500">*</span></label>
              <textarea rows={8} value={formData.content}
                onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                placeholder="Escreva o conteúdo completo do artigo aqui..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1 text-right">{formData.content.length} caracteres</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidade</label>
                <select value={formData.visibility}
                  onChange={(e) => setFormData((p) => ({ ...p, visibility: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="PUBLIC">Público</option>
                  <option value="INTERNAL">Interno</option>
                  <option value="PRIVATE">Privado</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_published}
                    onChange={(e) => setFormData((p) => ({ ...p, is_published: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Publicar agora</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2">
                {submitting ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</> : 'Salvar Artigo'}
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
            placeholder="🔍 Buscar artigos..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {categories.length > 0 && (
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas as categorias</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {(search || filterCategory) && (
            <button onClick={() => { setSearch(''); setFilterCategory('') }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition">
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Articles */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search || filterCategory ? 'Nenhum artigo encontrado' : 'Base de conhecimento vazia'}
          </h3>
          <p className="text-gray-400 text-sm">
            {search || filterCategory ? 'Tente outros termos.' : 'Crie o primeiro artigo clicando em "+ Novo Artigo".'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{visible.length} artigo(s)</p>
          {visible.map((article) => {
            const cat = categories.find((c) => c.id === article.category_id)
            return (
              <div key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition">
                        📄 {article.title}
                      </h3>
                      {article.is_published && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publicado</span>
                      )}
                      {cat && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{cat.name}</span>
                      )}
                    </div>
                    {article.summary && (
                      <p className="text-gray-500 text-sm line-clamp-2">{article.summary}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {article.view_count !== undefined && <span>👁 {article.view_count} visualizações</span>}
                      {article.helpful_count !== undefined && <span>👍 {article.helpful_count}</span>}
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-400 transition text-xl flex-shrink-0">›</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
