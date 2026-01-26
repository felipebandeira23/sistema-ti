import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface SLAMetrics {
  id: string
  service: string
  response_time: number
  resolution_time: number
  availability: number
  uptime_percentage: number
  status: 'ok' | 'warning' | 'critical'
  created_at: string
}

interface SLAPageProps {
  token: string
}

export function SLAPage({ token }: SLAPageProps) {
  const [slas, setSLAs] = useState<SLAMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    service: '',
    response_time: 4,
    resolution_time: 24,
    availability: 99.5,
  })

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchSLAs()
  }, [token])

  const fetchSLAs = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/sla/', { headers })
      setSLAs(response.data || [])
      setError('')
    } catch (err) {
      setError('Erro ao carregar SLAs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/sla/', formData, { headers })
      setFormData({ service: '', response_time: 4, resolution_time: 24, availability: 99.5 })
      setShowForm(false)
      fetchSLAs()
    } catch (err) {
      setError('Erro ao criar SLA')
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'ok':
        return '✓'
      case 'warning':
        return '⚠️'
      case 'critical':
        return '✗'
      default:
        return '?'
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">SLA - Service Level Agreement</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Novo SLA'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
              <input
                type="text"
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempo de Resposta (horas)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.response_time}
                  onChange={(e) => setFormData({ ...formData, response_time: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempo de Resolução (horas)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.resolution_time}
                  onChange={(e) => setFormData({ ...formData, resolution_time: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disponibilidade (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Criar SLA
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slas.map((sla) => (
          <div key={sla.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">{sla.service}</h3>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(sla.status)}`}>
                {getStatusEmoji(sla.status)} {sla.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              {/* Tempo de Resposta */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Tempo de Resposta</span>
                  <span className="text-sm text-gray-600">{sla.response_time}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((sla.response_time / 24) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Tempo de Resolução */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Tempo de Resolução</span>
                  <span className="text-sm text-gray-600">{sla.resolution_time}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min((sla.resolution_time / 72) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Disponibilidade */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Disponibilidade</span>
                  <span className="text-sm font-bold text-gray-900">{sla.availability}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      sla.availability >= 99
                        ? 'bg-green-600'
                        : sla.availability >= 95
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                    }`}
                    style={{ width: `${sla.availability}%` }}
                  />
                </div>
              </div>

              {/* Uptime */}
              <div className="bg-gray-50 rounded p-3 mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Uptime do Mês:</span> {sla.uptime_percentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slas.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Nenhum SLA configurado
        </div>
      )}
    </div>
  )
}
