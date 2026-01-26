import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  type: string
  opened_by: string
  created_at: string
}

interface TicketsPageProps {
  token: string
}

export function TicketsPage({ token }: TicketsPageProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'INCIDENTE',
    priority: 'MEDIA',
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await axios.get('/api/tickets/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTickets(response.data)
    } catch (error) {
      console.error('Erro ao buscar tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/tickets/', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFormData({ title: '', description: '', type: 'INCIDENTE', priority: 'MEDIA' })
      setShowForm(false)
      fetchTickets()
    } catch (error) {
      console.error('Erro ao criar ticket:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA':
        return 'bg-red-100 text-red-800'
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800'
      case 'BAIXA':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTO':
        return 'bg-blue-100 text-blue-800'
      case 'EM_PROGRESSO':
        return 'bg-purple-100 text-purple-800'
      case 'FECHADO':
        return 'bg-green-100 text-green-800'
      case 'AGUARDANDO_USUARIO':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Tickets</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Novo Ticket
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-xl font-semibold mb-4">Criar Novo Ticket</h3>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option>INCIDENTE</option>
                  <option>REQUISICAO</option>
                  <option>PROBLEMA</option>
                  <option>MUDANCA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option>ALTA</option>
                  <option>MEDIA</option>
                  <option>BAIXA</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              Nenhum ticket encontrado
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{ticket.description}</p>
                
                <div className="flex gap-2 mb-2">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    Prioridade: {ticket.priority}
                  </span>
                  <span className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                    Tipo: {ticket.type}
                  </span>
                </div>

                <div className="text-sm text-gray-500 border-t pt-2 mt-2">
                  <p>Criado em: {new Date(ticket.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
