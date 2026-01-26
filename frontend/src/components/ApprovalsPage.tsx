import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Approval {
  id: string
  ticket_id: string
  requester: string
  approver: string
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  created_at: string
  updated_at: string
}

interface ApprovalsPageProps {
  token: string
}

export function ApprovalsPage({ token }: ApprovalsPageProps) {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchApprovals()
  }, [token, filter])

  const fetchApprovals = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await axios.get('/api/approvals/', { headers, params })
      setApprovals(response.data || [])
      setError('')
    } catch (err) {
      setError('Erro ao carregar aprovações')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await axios.patch(`/api/approvals/${id}/approve`, {}, { headers })
      fetchApprovals()
    } catch (err) {
      setError('Erro ao aprovar')
      console.error(err)
    }
  }

  const handleReject = async (id: string, reason: string) => {
    try {
      await axios.patch(`/api/approvals/${id}/reject`, { reason }, { headers })
      fetchApprovals()
    } catch (err) {
      setError('Erro ao rejeitar')
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8">Fluxo de Aprovações</h2>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

      <div className="flex gap-3 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'pending'
              ? '⏳ Pendentes'
              : status === 'approved'
                ? '✓ Aprovadas'
                : status === 'rejected'
                  ? '✗ Rejeitadas'
                  : 'Todas'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {approvals.map((approval) => (
          <div key={approval.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">Ticket #{approval.ticket_id}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Solicitante: <span className="font-medium">{approval.requester}</span>
                </p>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[approval.status]}`}>
                {approval.status === 'pending'
                  ? '⏳ Pendente'
                  : approval.status === 'approved'
                    ? '✓ Aprovada'
                    : '✗ Rejeitada'}
              </span>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-gray-700">
                <span className="font-medium">Motivo:</span> {approval.reason}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Aprovador: <span className="font-medium">{approval.approver}</span>
              </p>
            </div>

            {approval.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(approval.id)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                >
                  ✓ Aprovar
                </button>
                <button
                  onClick={() => handleReject(approval.id, 'Rejeitado pelo aprovador')}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium"
                >
                  ✗ Rejeitar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {approvals.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Nenhuma aprovação encontrada com este filtro
        </div>
      )}
    </div>
  )
}
