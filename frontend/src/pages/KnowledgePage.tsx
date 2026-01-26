import React, { useState } from 'react'
import { useKnowledgeArticles, useSearchKnowledgeArticles } from '../../hooks/useApi'
import { Layout, PageContainer } from '../shared/Layout'
import { Button, Card, Loading, EmptyState, Input, Select } from '../shared/UI'
import { formatDate, formatRelativeTime } from '../../utils/format'

export function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [filters, setFilters] = useState({ category_id: '', page: 1 })

  const { data: articlesData, isLoading } = useKnowledgeArticles(filters)
  const { data: searchResults } = useSearchKnowledgeArticles(searchQuery)

  const articles = searchQuery && searchResults ? searchResults.items : articlesData?.items || []
  const categories = [
    { value: 'redes', label: 'Redes' },
    { value: 'servidores', label: 'Servidores' },
    { value: 'segurança', label: 'Segurança' },
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
  ]

  return (
    <Layout>
      <PageContainer
        title="Base de Conhecimento"
        subtitle="Acesse FAQ, tutoriais e documentação técnica"
        action={
          <Button variant="primary">
            + Novo Artigo
          </Button>
        }
      >
        {/* Busca e Filtros */}
        <Card className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Artigos</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Digite sua pergunta ou tema..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-4 top-3 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === cat.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Artigos */}
        {isLoading ? (
          <Loading message="Carregando artigos..." />
        ) : articles.length === 0 ? (
          <EmptyState
            title="Nenhum artigo encontrado"
            description={searchQuery ? 'Tente uma busca diferente' : 'Nenhum artigo disponível'}
            icon="📚"
          />
        ) : (
          <div className="space-y-4">
            {articles.map((article: any) => (
              <Card key={article.id} className="hover:shadow-md transition cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📄</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mt-2 line-clamp-2">{article.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>👁️ {article.views_count} visualizações</span>
                      <span>📅 {formatRelativeTime(article.created_at)}</span>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-2">
                          {article.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Ler Mais
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Artigos Populares */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Artigos Populares</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Como Resetar sua Senha',
                views: 1250,
                icon: '🔐',
              },
              {
                title: 'Configurar VPN',
                views: 980,
                icon: '🌐',
              },
              {
                title: 'Requisitar Acesso a Aplicação',
                views: 756,
                icon: '✅',
              },
            ].map((item, index) => (
              <Card key={index} className="hover:shadow-md transition cursor-pointer">
                <div className="text-center">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">👁️ {item.views} visualizações</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    </Layout>
  )
}
