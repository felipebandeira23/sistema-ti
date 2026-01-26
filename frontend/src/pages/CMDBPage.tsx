import React, { useState } from 'react'
import { useConfigItems, useCreateConfigItem, useImpactAnalysis } from '../../hooks/useApi'
import { Layout, PageContainer } from '../shared/Layout'
import { Button, Card, Loading, EmptyState, Input, Select, Modal } from '../shared/UI'
import type { ConfigItemType } from '../../types'

export function CMDBPage() {
  const [filters, setFilters] = useState({ type: '', status: '', page: 1 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'HARDWARE' as ConfigItemType,
    description: '',
  })

  const { data: itemsData, isLoading } = useConfigItems(filters)
  const createItem = useCreateConfigItem()

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createItem.mutateAsync(formData)
      setFormData({ code: '', name: '', type: 'HARDWARE', description: '' })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Erro ao criar CI:', error)
    }
  }

  const items = itemsData?.items || []
  const typeIcons: Record<ConfigItemType, string> = {
    HARDWARE: '💻',
    SOFTWARE: '📦',
    SERVIÇO: '🔧',
    APLICAÇÃO: '🖥️',
    BANCO_DADOS: '📊',
    REDE: '🌐',
    DOCUMENTAÇÃO: '📄',
  }

  return (
    <Layout>
      <PageContainer
        title="CMDB - Configuration Items"
        subtitle="Gerenciar itens de configuração e suas relações"
        action={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Novo CI
          </Button>
        }
      >
        {/* Filtros */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo"
              options={[
                { value: 'HARDWARE', label: 'Hardware' },
                { value: 'SOFTWARE', label: 'Software' },
                { value: 'SERVIÇO', label: 'Serviço' },
                { value: 'APLICAÇÃO', label: 'Aplicação' },
                { value: 'BANCO_DADOS', label: 'Banco de Dados' },
                { value: 'REDE', label: 'Rede' },
                { value: 'DOCUMENTAÇÃO', label: 'Documentação' },
              ]}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            />
            <Input
              label="Buscar"
              placeholder="Buscar por nome ou código..."
            />
          </div>
        </Card>

        {/* Lista de CIs */}
        {isLoading ? (
          <Loading message="Carregando CIs..." />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum CI encontrado"
            description="Comece criando seu primeiro item de configuração"
            icon="⚙️"
            action={
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Criar Primeiro CI
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <Card key={item.id} className="hover:shadow-md transition cursor-pointer">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{typeIcons[item.type]}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500">Código: {item.code}</p>
                  </div>
                </div>
                
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}

                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium text-gray-900">{item.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === 'ATIVA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    Relações
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Modal de Criação */}
      <Modal
        isOpen={showCreateModal}
        title="Criar Novo CI"
        onClose={() => setShowCreateModal(false)}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateItem}
              isLoading={createItem.isPending}
            >
              Criar CI
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Código"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="CI-2024-001"
            required
          />
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do item de configuração"
            required
          />
          <Select
            label="Tipo"
            options={[
              { value: 'HARDWARE', label: 'Hardware' },
              { value: 'SOFTWARE', label: 'Software' },
              { value: 'SERVIÇO', label: 'Serviço' },
              { value: 'APLICAÇÃO', label: 'Aplicação' },
              { value: 'BANCO_DADOS', label: 'Banco de Dados' },
              { value: 'REDE', label: 'Rede' },
              { value: 'DOCUMENTAÇÃO', label: 'Documentação' },
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ConfigItemType })}
          />
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descrição (opcional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </form>
      </Modal>
    </Layout>
  )
}
