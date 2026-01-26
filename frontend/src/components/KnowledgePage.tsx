import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface KnowledgeArticle {
  id: string
  title: string
  slug: string
  summary: string
  is_published: boolean
  visibility: string
}

interface KnowledgePageProps {
  token: string
}

export function KnowledgePage({ token }: KnowledgePageProps) {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await axios.get('/api/knowledge/articles/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setArticles(response.data)
    } catch (error) {
      console.error('Erro ao buscar artigos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Base de Conhecimento</h2>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar artigos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              {articles.length === 0 ? 'Nenhum artigo encontrado' : 'Nenhum resultado para sua busca'}
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div key={article.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                    <p className="text-gray-600 mt-2">{article.summary}</p>
                  </div>
                  {article.is_published && (
                    <span className="ml-4 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Publicado
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
