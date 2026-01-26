import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardMetrics, useTicketTrends } from '../../hooks/useApi'
import { Layout, PageContainer, StatCard } from '../shared/Layout'
import { Card, Loading, EmptyState } from '../shared/UI'
import { formatNumber, formatPercentage } from '../../utils/format'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: trends, isLoading: trendsLoading } = useTicketTrends(30)

  if (metricsLoading || trendsLoading) {
    return (
      <Layout>
        <PageContainer title="Dashboard">
          <Loading message="Carregando dados do dashboard..." />
        </PageContainer>
      </Layout>
    )
  }

  if (!metrics) {
    return (
      <Layout>
        <PageContainer title="Dashboard">
          <EmptyState
            title="Sem dados disponíveis"
            description="Nenhuma métrica encontrada"
          />
        </PageContainer>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageContainer title="Dashboard" subtitle="Visão geral do sistema ITSM">
        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Tickets"
            value={formatNumber(metrics.total_tickets)}
            icon="🎫"
            color="blue"
          />
          <StatCard
            title="Tickets Abertos"
            value={formatNumber(metrics.open_tickets)}
            icon="📂"
            color="blue"
            trend={{ value: 5, isPositive: false }}
          />
          <StatCard
            title="Tickets Vencidos"
            value={formatNumber(metrics.overdue_tickets)}
            icon="⏰"
            color="red"
          />
          <StatCard
            title="Conformidade SLA"
            value={formatPercentage(metrics.sla_compliance)}
            icon="✓"
            color="green"
            trend={{ value: 2, isPositive: true }}
          />
        </div>

        {/* Secção de Qualidade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card title="Índices de Satisfação">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Satisfação Geral</span>
                  <span className="text-sm font-bold text-gray-900">{metrics.customer_satisfaction.toFixed(1)}/5</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full transition"
                    style={{ width: `${(metrics.customer_satisfaction / 5) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {['Suporte', 'Qualidade', 'Tempo'].map((label) => (
                  <div key={label} className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">{label}</p>
                    <p className="text-lg font-bold text-blue-600">4.2</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Tempo Médio de Resolução">
            <div className="space-y-4">
              <div className="text-4xl font-bold text-blue-600">
                {metrics.average_resolution_time.toFixed(1)}h
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Incidentes</p>
                  <p className="font-semibold text-gray-900">2.5h</p>
                </div>
                <div>
                  <p className="text-gray-600">Requisições</p>
                  <p className="font-semibold text-gray-900">4.2h</p>
                </div>
                <div>
                  <p className="text-gray-600">Problemas</p>
                  <p className="font-semibold text-gray-900">8.1h</p>
                </div>
                <div>
                  <p className="text-gray-600">Mudanças</p>
                  <p className="font-semibold text-gray-900">6.3h</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Distribuição de Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card title="Por Prioridade">
            <div className="space-y-3">
              {Object.entries(metrics.tickets_by_priority).map(([priority, count]) => {
                const colors: Record<string, string> = {
                  CRÍTICA: 'bg-red-500',
                  ALTA: 'bg-orange-500',
                  MÉDIA: 'bg-yellow-500',
                  BAIXA: 'bg-green-500',
                }
                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{priority}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[priority]} rounded-full`}
                        style={{
                          width: `${(count / metrics.total_tickets) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card title="Por Status">
            <div className="space-y-3">
              {Object.entries(metrics.tickets_by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{status}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Por Tipo">
            <div className="space-y-3">
              {Object.entries(metrics.tickets_by_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{type}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Atajos para Módulos */}
        <Card title="Acesso Rápido">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Novo Ticket', path: '/tickets/new', icon: '🎫' },
              { label: 'Meus Tickets', path: '/tickets', icon: '📂' },
              { label: 'Base de Conhecimento', path: '/knowledge', icon: '📚' },
              { label: 'Catálogo de Serviços', path: '/catalog', icon: '📋' },
              { label: 'Aprovações', path: '/approvals', icon: '✅' },
              { label: 'Inventário', path: '/assets', icon: '📦' },
              { label: 'CMDB', path: '/cmdb', icon: '⚙️' },
              { label: 'SLA', path: '/sla', icon: '⏱️' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition text-center"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Notificações / Alertas */}
        <div className="mt-8">
          <Card title="Alertas">
            <div className="space-y-3">
              {metrics.overdue_tickets > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-semibold text-red-800">⚠️ {metrics.overdue_tickets} Tickets Vencidos</p>
                  <p className="text-sm text-red-700 mt-1">Ação imediata necessária para conformidade com SLA</p>
                </div>
              )}
              {metrics.sla_compliance < 90 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-semibold text-yellow-800">🔔 Conformidade SLA Baixa</p>
                  <p className="text-sm text-yellow-700 mt-1">SLA está em {metrics.sla_compliance.toFixed(1)}%, objetivo é 95%</p>
                </div>
              )}
              {metrics.overdue_tickets === 0 && metrics.sla_compliance >= 90 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-800">✓ Sistema Operacional</p>
                  <p className="text-sm text-green-700 mt-1">Todos os SLAs em conformidade</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>
    </Layout>
  )
}
