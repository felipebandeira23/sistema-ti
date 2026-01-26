import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTickets, useCreateTicket, useUpdateTicketStatus } from '../../hooks/useApi'
import { Layout, PageContainer } from '../shared/Layout'
import { Button, Card, Loading, EmptyState, Input, TextArea, Select, Modal } from '../shared/UI'
import { getPriorityColor, getStatusColor, getTicketTypeIcon, formatDateTime, formatRelativeTime } from '../../utils/format'
import type { TicketType, TicketPriority } from '../../types'

export function TicketsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', page: 1 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'INCIDENTE' as TicketType,
    priority: 'MÉDIA' as TicketPriority,
  })

  const { data: ticketsData, isLoading } = useTickets(filters)
  const createTicket = useCreateTicket()

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTicket.mutateAsync(formData)
      setFormData({ title: '', description: '', type: 'INCIDENTE', priority: 'MÉDIA' })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Erro ao criar ticket:', error)
    }
  }

  const tickets = ticketsData?.items || []

  return (
    <Layout>
      <PageContainer
        title="Tickets"
        subtitle="Gerenciar incidentes, requisições, problemas e mudanças"
        action={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Novo Ticket
          </Button>
        }
      >
        {/* Filtros */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Status"
              options={[
                { value: 'ABERTO', label: 'Aberto' },
                { value: 'EM_PROGRESSO', label: 'Em Progresso' },
                { value: 'AGUARDANDO_USUARIO', label: 'Aguardando Usuário' },
                { value: 'RESOLVIDO', label: 'Resolvido' },
                { value: 'FECHADO', label: 'Fechado' },
              ]}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            />
            <Select
              label="Prioridade"
              options={[
                { value: 'BAIXA', label: 'Baixa' },
                { value: 'MÉDIA', label: 'Média' },
                { value: 'ALTA', label: 'Alta' },
                { value: 'CRÍTICA', label: 'Crítica' },
              ]}
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
            />
            <Select
              label="Tipo"
              options={[
                { value: 'INCIDENTE', label: 'Incidente' },
                { value: 'REQUISIÇÃO', label: 'Requisição' },
                { value: 'PROBLEMA', label: 'Problema' },
                { value: 'MUDANÇA', label: 'Mudança' },
              ]}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            />
            <Input
              label="Buscar"
              type="text"
              placeholder="Buscar por título..."
            />
          </div>
        </Card>

        {/* Lista de Tickets */}
        {isLoading ? (
          <Loading message="Carregando tickets..." />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="Nenhum ticket encontrado"
            description="Nenhum ticket corresponde aos filtros selecionados"
            action={
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Criar Primeiro Ticket
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getTicketTypeIcon(ticket.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                      <span className="text-xs text-gray-500">#{ticket.number}</span>
                    </div>
                    <p className="text-sm text-gray-600">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>Aberto {formatRelativeTime(ticket.created_at)}</span>
                      {ticket.assigned_to && <span>• Atribuído a {ticket.assigned_to}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status).bg} ${getStatusColor(ticket.status).text}`}>
                      {ticket.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority).bg} ${getPriorityColor(ticket.priority).text}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Modal de Criação */}
      <Modal
        isOpen={showCreateModal}
        title="Criar Novo Ticket"
        onClose={() => setShowCreateModal(false)}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTicket}
              isLoading={createTicket.isPending}
            >
              Criar Ticket
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Descrição breve do problema"
            required
          />
          <TextArea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o problema em detalhes"
            rows={5}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              options={[
                { value: 'INCIDENTE', label: 'Incidente' },
                { value: 'REQUISIÇÃO', label: 'Requisição' },
                { value: 'PROBLEMA', label: 'Problema' },
                { value: 'MUDANÇA', label: 'Mudança' },
              ]}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TicketType })}
            />
            <Select
              label="Prioridade"
              options={[
                { value: 'BAIXA', label: 'Baixa' },
                { value: 'MÉDIA', label: 'Média' },
                { value: 'ALTA', label: 'Alta' },
                { value: 'CRÍTICA', label: 'Crítica' },
              ]}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
            />
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
