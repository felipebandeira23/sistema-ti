import React, { useState, useEffect } from 'react'
import axios from 'axios'
import API_ENDPOINTS from '../api/endpoints'

interface ConfigItem {
  id: string
  name: string
  type: 'Hardware' | 'Software' | 'Network' | 'Service'
  status: string
  owner: string
  location: string
  description: string
  created_at: string
}

interface CMDBPageProps {
  token: string
}

export function CMDBPage({ token }: CMDBPageProps) {
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Hardware' as const,
    status: 'active',
    owner: '',
    location: '',
    description: '',
  })

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchItems()
  }, [token])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await axios.get(API_ENDPOINTS.CMDB.LIST, { headers })
      setItems(response.data || [])
      setError('')
    } catch (err) {
      setError('Erro ao carregar itens CMDB')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(API_ENDPOINTS.CMDB.CREATE, formData, { headers })
      setFormData({ name: '', type: 'Hardware', status: 'active', owner: '', location: '', description: '' })
      setShowForm(false)
      fetchItems()
    } catch (err) {
      setError('Erro ao criar item CMDB')
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">CMDB - Configuration Items</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Novo Item'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option>Hardware</option>
                  <option>Software</option>
                  <option>Network</option>
                  <option>Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proprietário</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Criar Item
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Proprietário</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Localização</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{item.name}</td>
                <td className="px-6 py-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-3">{item.owner}</td>
                <td className="px-6 py-3">{item.location}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">Nenhum item CMDB encontrado</div>
        )}
      </div>
    </div>
  )
}
