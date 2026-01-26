import React from 'react'
import { Layout, PageContainer } from '../shared/Layout'
import { Card, Loading, EmptyState } from '../shared/UI'

export function SLAPage() {
  // Exemplo estático
  const slaList = [
    {
      id: '1',
      name: 'Incidentes - Alta Prioridade',
      response_time_hours: 2,
      resolution_time_hours: 8,
      compliance: 97.5,
    },
    {
      id: '2',
      name: 'Requisições - Média Prioridade',
      response_time_hours: 4,
      resolution_time_hours: 24,
      compliance: 92.1,
    },
  ]

  return (
    <Layout>
      <PageContainer
        title="SLA - Acordos de Nível de Serviço"
        subtitle="Gerencie e monitore os SLAs do sistema"
      >
        {slaList.length === 0 ? (
          <EmptyState
            title="Nenhum SLA cadastrado"
            description="Cadastre SLAs para monitorar o desempenho do atendimento."
            icon="⏱️"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slaList.map((sla) => (
              <Card key={sla.id} className="hover:shadow-md transition cursor-pointer">
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-2xl">⏱️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{sla.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-700 mb-2">
                  <span>Tempo de Resposta: <strong>{sla.response_time_hours}h</strong></span>
                  <span>Tempo de Resolução: <strong>{sla.resolution_time_hours}h</strong></span>
                </div>
                <div className="mt-2">
                  <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    Conformidade: {sla.compliance}%
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </Layout>
  )
}
