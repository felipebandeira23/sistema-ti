import React, { useState } from 'react'
import { Layout, PageContainer } from '../shared/Layout'
import { Button, Card, Loading, EmptyState } from '../shared/UI'

export function ServiceCatalogPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const services = [
    {
      id: '1',
      name: 'Criar Usuário',
      description: 'Requisitar criação de novo usuário no sistema',
      icon: '👤',
      category: 'Usuários',
    },
    {
      id: '2',
      name: 'Resetar Senha',
      description: 'Solicitar reset de senha',
      icon: '🔐',
      category: 'Segurança',
    },
    {
      id: '3',
      name: 'Acesso VPN',
      description: 'Solicitar acesso à rede VPN',
      icon: '🌐',
      category: 'Rede',
    },
    {
      id: '4',
      name: 'Requisitar Software',
      description: 'Solicitar instalação de software',
      icon: '📦',
      category: 'Software',
    },
    {
      id: '5',
      name: 'Hardware Novo',
      description: 'Solicitar novo equipamento',
      icon: '💻',
      category: 'Hardware',
    },
    {
      id: '6',
      name: 'Acesso Aplicação',
      description: 'Solicitar acesso a aplicação específica',
      icon: '✅',
      category: 'Aplicações',
    },
  ]

  return (
    <Layout>
      <PageContainer
        title="Catálogo de Serviços"
        subtitle="Serviços disponíveis para requisição"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedService(service.id)}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">{service.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium mb-4">
                  {service.category}
                </span>
                <Button variant="primary" size="sm" className="w-full">
                  Solicitar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
    </Layout>
  )
}
