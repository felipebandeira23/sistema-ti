import React, { useState, useEffect } from 'react'
import axios from 'axios'
import API_ENDPOINTS from '../api/endpoints'

interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  status: string
  created_at: string
}

interface ServiceCatalogPageProps {
  token: string
}

export function ServiceCatalogPage({ token }: ServiceCatalogPageProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    status: 'available',
  })

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchServices()
  }, [token])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await axios.get(API_ENDPOINTS.CATALOG.ITEMS, { headers })
      setServices(response.data || [])
      setError('')
    } catch (err) {
      setError('Erro ao carregar catálogo de serviços')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(API_ENDPOINTS.CATALOG.CREATE_ITEM, formData, { headers })
      setFormData({ name: '', description: '', category: '', price: 0, status: 'available' })
      setShowForm(false)
      fetchServices()
    } catch (err) {
      setError('Erro ao criar serviço')
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Catálogo de Serviços</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Novo Serviço'}
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={4}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Criar Serviço
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
            <h3 className="text-xl font-bold mb-2">{service.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{service.description}</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{service.category}</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  R$ {service.price.toFixed(2)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  service.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {service.status === 'available' ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Nenhum serviço no catálogo
        </div>
      )}
    </div>
  )
}
