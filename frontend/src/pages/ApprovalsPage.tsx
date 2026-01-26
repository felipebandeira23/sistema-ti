import React from 'react'
import { Layout, PageContainer } from '../shared/Layout'
import { Card, Loading, EmptyState, Button } from '../shared/UI'

export function ApprovalsPage() {
  // Exemplo estático
  const approvals = [
    {
      id: '1',
      title: 'Aprovação de Requisição de Software',
      status: 'PENDENTE',
      requested_by: 'João Silva',
      created_at: '2026-01-20T10:00:00Z',
      level: 1,
    },
    {
      id: '2',
      title: 'Aprovação de Mudança de Rede',
      status: 'APROVADO',
      requested_by: 'Maria Souza',
      created_at: '2026-01-18T14:30:00Z',
      level: 2,
    },
  ]

  return (
    <Layout>
      <PageContainer
        title="Aprovações"
        subtitle="Gerencie solicitações e decisões de aprovação"
      >
        {approvals.length === 0 ? (
          <EmptyState
            title="Nenhuma aprovação pendente"
            description="Você não possui solicitações de aprovação no momento."
            icon="✅"
          />
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <Card key={approval.id} className="hover:shadow-md transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">✅</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{approval.title}</h3>
                    <p className="text-xs text-gray-500">
                      Solicitado por {approval.requested_by} em {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    approval.status === 'PENDENTE'
                      ? 'bg-yellow-100 text-yellow-800'
                      : approval.status === 'APROVADO'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {approval.status}
                  </span>
                  <Button variant="primary" size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </Layout>
  )
}
