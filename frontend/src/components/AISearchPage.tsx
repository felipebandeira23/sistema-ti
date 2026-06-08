import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface AISearchPageProps {
  token: string
}

interface SearchResult {
  id: string
  title: string
  description?: string
  summary?: string
  source: 'ticket' | 'article' | 'problem' | 'change'
  status?: string
  created_at?: string
  score?: number
}

interface SimilarTicket {
  id: string
  title: string
  description?: string
  status?: string
  priority?: string
  created_at?: string
  score?: number
}

interface SuggestedArticle {
  id: string
  title: string
  summary?: string
  is_published?: boolean
  view_count?: number
  created_at?: string
  score?: number
}

type ResultTab = 'todos' | 'ticket' | 'article' | 'problem' | 'change'

const SOURCE_ICONS: Record<string, string> = {
  ticket: '🎫',
  article: '📄',
  problem: '🔍',
  change: '🔄',
}

const SOURCE_LABELS: Record<string, string> = {
  ticket: 'Ticket',
  article: 'Artigo',
  problem: 'Problema',
  change: 'Mudança',
}

const SOURCE_BADGE_STYLES: Record<string, string> = {
  ticket: 'bg-blue-100 text-blue-800',
  article: 'bg-purple-100 text-purple-800',
  problem: 'bg-yellow-100 text-yellow-800',
  change: 'bg-orange-100 text-orange-800',
}

const STATUS_STYLES: Record<string, string> = {
  ABERTO: 'bg-blue-100 text-blue-700',
  EM_PROGRESSO: 'bg-purple-100 text-purple-700',
  RESOLVIDO: 'bg-green-100 text-green-700',
  FECHADO: 'bg-gray-100 text-gray-600',
  NOVO: 'bg-blue-100 text-blue-700',
  ANALISE: 'bg-yellow-100 text-yellow-700',
  RASCUNHO: 'bg-gray-100 text-gray-600',
  APROVADO: 'bg-teal-100 text-teal-700',
}

const SEARCH_TIPS = [
  'Descreva o problema em linguagem natural: "impressora não funciona"',
  'Procure por erros específicos: "erro 500 no login"',
  'Busque por sistemas: "VPN desconectando no Windows"',
  'Encontre soluções: "como resetar senha LDAP"',
  'Identifique incidentes similares: "lentidão no ERP"',
]

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const colorClass =
    pct >= 80 ? 'text-green-700 bg-green-50' :
    pct >= 60 ? 'text-yellow-700 bg-yellow-50' :
    'text-gray-500 bg-gray-50'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
      {pct}% relevância
    </span>
  )
}

function ResultCard({ result }: { result: SearchResult }) {
  const snippet = result.description ?? result.summary ?? ''
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition group cursor-pointer">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{SOURCE_ICONS[result.source] ?? '📋'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">
              {result.title}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_BADGE_STYLES[result.source] ?? 'bg-gray-100 text-gray-600'}`}>
              {SOURCE_LABELS[result.source] ?? result.source}
            </span>
            {result.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[result.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {result.status.replace(/_/g, ' ')}
              </span>
            )}
            {result.score !== undefined && result.score > 0 && (
              <ScoreBadge score={result.score} />
            )}
          </div>
          {snippet && (
            <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{snippet}</p>
          )}
          {result.created_at && (
            <p className="text-gray-400 text-xs mt-1">{formatDate(result.created_at)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SimilarTicketCard({ ticket }: { ticket: SimilarTicket }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 hover:border-blue-200 hover:shadow-sm transition cursor-pointer">
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">🎫</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
          {ticket.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ticket.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {ticket.status && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {ticket.status.replace(/_/g, ' ')}
              </span>
            )}
            {ticket.score !== undefined && ticket.score > 0 && (
              <ScoreBadge score={ticket.score} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ArticleSuggestionCard({ article }: { article: SuggestedArticle }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3 hover:border-purple-200 hover:shadow-sm transition cursor-pointer">
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">📄</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
          {article.summary && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{article.summary}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {article.is_published && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Publicado</span>
            )}
            {article.view_count !== undefined && (
              <span className="text-xs text-gray-400">👁 {article.view_count}</span>
            )}
            {article.score !== undefined && article.score > 0 && (
              <ScoreBadge score={article.score} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonResult() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-full mb-1" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}

function SkeletonSidebar() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function AISearchPage({ token }: AISearchPageProps) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([])
  const [suggestedArticles, setSuggestedArticles] = useState<SuggestedArticle[]>([])
  const [searching, setSearching] = useState(false)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [resultTab, setResultTab] = useState<ResultTab>('todos')
  const [hasSearched, setHasSearched] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headers = { Authorization: `Bearer ${token}` }

  // Fetch main search results
  const fetchSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setSearching(true)
    setHasSearched(true)
    try {
      const res = await axios.get('/api/ai/search', { headers, params: { q: q.trim() } })
      const data = res.data
      setResults(Array.isArray(data) ? data : data.results ?? data.items ?? [])
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status !== 404) {
        toast.error('Erro ao realizar busca inteligente')
      }
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [token])

  // Fetch similar tickets
  const fetchSimilarTickets = useCallback(async (q: string) => {
    if (!q.trim()) { setSimilarTickets([]); return }
    setLoadingSimilar(true)
    try {
      const res = await axios.get('/api/ai/similar-tickets', { headers, params: { q: q.trim() } })
      const data = res.data
      setSimilarTickets(Array.isArray(data) ? data : data.results ?? data.items ?? [])
    } catch {
      setSimilarTickets([])
    } finally {
      setLoadingSimilar(false)
    }
  }, [token])

  // Fetch suggested articles
  const fetchSuggestedArticles = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestedArticles([]); return }
    setLoadingArticles(true)
    try {
      const res = await axios.get('/api/ai/suggest-articles', { headers, params: { q: q.trim() } })
      const data = res.data
      setSuggestedArticles(Array.isArray(data) ? data : data.results ?? data.items ?? [])
    } catch {
      setSuggestedArticles([])
    } finally {
      setLoadingArticles(false)
    }
  }, [token])

  // Debounced auto-suggestions on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.trim().length < 3) {
      setSimilarTickets([])
      setSuggestedArticles([])
      return
    }
    debounceRef.current = setTimeout(() => {
      fetchSimilarTickets(query)
      fetchSuggestedArticles(query)
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchSimilarTickets, fetchSuggestedArticles])

  const handleSearch = () => {
    if (!query.trim()) { toast.warning('Digite algo para buscar'); return }
    setCommittedQuery(query.trim())
    setResultTab('todos')
    fetchSearch(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleClear = () => {
    setQuery('')
    setCommittedQuery('')
    setResults([])
    setSimilarTickets([])
    setSuggestedArticles([])
    setHasSearched(false)
    setResultTab('todos')
  }

  // Filter results by active tab
  const filteredResults = resultTab === 'todos'
    ? results
    : results.filter((r) => r.source === resultTab)

  // Count by source
  const countBySource = (source: string) => results.filter((r) => r.source === source).length

  // Group results by source for "todos" tab
  const grouped = resultTab === 'todos'
    ? (['ticket', 'article', 'problem', 'change'] as const).reduce<Record<string, SearchResult[]>>((acc, src) => {
        const items = results.filter((r) => r.source === src)
        if (items.length > 0) acc[src] = items
        return acc
      }, {})
    : null

  const resultTabs: { id: ResultTab; label: string }[] = [
    { id: 'todos', label: `Todos (${results.length})` },
    { id: 'ticket', label: `Tickets (${countBySource('ticket')})` },
    { id: 'article', label: `Artigos (${countBySource('article')})` },
    { id: 'problem', label: `Problemas (${countBySource('problem')})` },
    { id: 'change', label: `Mudanças (${countBySource('change')})` },
  ]

  const showSuggestions = query.trim().length >= 3 && (similarTickets.length > 0 || suggestedArticles.length > 0 || loadingSimilar || loadingArticles)
  const showEmptyState = !hasSearched && !searching
  const showNoResults = hasSearched && !searching && results.length === 0

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Busca Inteligente</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Encontre tickets, artigos e problemas com busca semântica
        </p>
      </div>

      {/* Search box */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔎</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva o que você procura em linguagem natural..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2 flex-shrink-0"
          >
            {searching ? (
              <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Buscando...</>
            ) : (
              'Buscar'
            )}
          </button>
        </div>

        {committedQuery && !searching && (
          <p className="text-xs text-gray-400 mt-2 pl-1">
            {results.length > 0
              ? `${results.length} resultado(s) para: "${committedQuery}"`
              : `Nenhum resultado para: "${committedQuery}"`}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main results column */}
        <div className="flex-1 min-w-0">
          {/* Loading skeleton */}
          {searching && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <SkeletonResult key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {showEmptyState && !searching && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="text-5xl mb-4">🔎</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Busca Semântica</h3>
              <p className="text-gray-400 text-sm mb-6">
                Use linguagem natural para encontrar o que precisa no sistema.
              </p>
              <div className="text-left max-w-md mx-auto space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dicas de busca:</p>
                {SEARCH_TIPS.map((tip, idx) => (
                  <div
                    key={idx}
                    onClick={() => setQuery(tip.split('"')[1] ?? tip)}
                    className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition group"
                  >
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">›</span>
                    <p className="text-sm text-gray-600 group-hover:text-blue-700 transition">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results state */}
          {showNoResults && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="text-5xl mb-4">🤔</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-400 text-sm mb-4">
                Não encontramos resultados para "{committedQuery}".
              </p>
              <div className="text-left max-w-sm mx-auto space-y-1">
                <p className="text-xs font-semibold text-gray-500 mb-2">Tente:</p>
                <p className="text-sm text-gray-500">• Usar termos mais genéricos</p>
                <p className="text-sm text-gray-500">• Verificar a ortografia</p>
                <p className="text-sm text-gray-500">• Descrever o problema de outra forma</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!searching && results.length > 0 && (
            <div className="space-y-4">
              {/* Result tabs */}
              <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
                {resultTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setResultTab(tab.id)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                      resultTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Grouped view for "todos" */}
              {resultTab === 'todos' && grouped && (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([source, items]) => (
                    <div key={source}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{SOURCE_ICONS[source]}</span>
                        <h3 className="text-sm font-semibold text-gray-700">{SOURCE_LABELS[source]}s</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                          {items.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.map((result) => (
                          <ResultCard key={result.id} result={result} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Flat list view for filtered tabs */}
              {resultTab !== 'todos' && (
                <div className="space-y-2">
                  {filteredResults.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                      <p className="text-gray-400 text-sm">Nenhum resultado do tipo "{SOURCE_LABELS[resultTab]}" encontrado.</p>
                    </div>
                  ) : (
                    filteredResults.map((result) => (
                      <ResultCard key={result.id} result={result} />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: suggestions (shown when typing or after search) */}
        {showSuggestions && (
          <div className="lg:w-80 flex-shrink-0 space-y-5">
            {/* Similar tickets */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                🎫 Tickets Similares
                {loadingSimilar && (
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500" />
                )}
              </h3>
              {loadingSimilar ? (
                <SkeletonSidebar />
              ) : similarTickets.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum ticket similar encontrado.</p>
              ) : (
                <div className="space-y-2">
                  {similarTickets.slice(0, 5).map((ticket) => (
                    <SimilarTicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              )}
            </div>

            {/* Suggested articles */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                📄 Artigos Sugeridos
                {loadingArticles && (
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500" />
                )}
              </h3>
              {loadingArticles ? (
                <SkeletonSidebar />
              ) : suggestedArticles.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum artigo sugerido encontrado.</p>
              ) : (
                <div className="space-y-2">
                  {suggestedArticles.slice(0, 5).map((article) => (
                    <ArticleSuggestionCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
