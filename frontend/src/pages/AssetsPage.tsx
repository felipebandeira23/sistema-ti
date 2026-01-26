import React, { useState } from 'react'
import { useAssets, useCreateAsset, useUpdateAssetStatus } from '../../hooks/useApi'
import { Layout, PageContainer } from '../shared/Layout'
import { Button, Card, Loading, EmptyState, Input, Select, Modal } from '../shared/UI'
import { getAssetTypeIcon, getAssetStatusColor, formatDate } from '../../utils/format'
import type { AssetType, AssetStatus } from '../../types'

export function AssetsPage() {
  const [filters, setFilters] = useState({ status: '', type: '', page: 1 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    asset_type: 'HARDWARE' as AssetType,
    status: 'DISPONÍVEL' as AssetStatus,
    serial_number: '',
    model: '',
    manufacturer: '',
  })

  const { data: assetsData, isLoading } = useAssets(filters)
  const createAsset = useCreateAsset()

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAsset.mutateAsync(formData)
      setFormData({
        code: '',
        name: '',
        asset_type: 'HARDWARE',
        status: 'DISPONÍVEL',
        serial_number: '',
        model: '',
        manufacturer: '',
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Erro ao criar ativo:', error)
    }
  }

  const assets = assetsData?.items || []

  return (
    <Layout>
      <PageContainer
        title="Inventário de Ativos"
        subtitle="Gerenciar todos os ativos de TI da COPPEAD"
        action={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Novo Ativo
          </Button>
        }
      >
        {/* Filtros */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Tipo de Ativo"
              options={[
                { value: 'HARDWARE', label: 'Hardware' },
                { value: 'PERIFÉRICO', label: 'Periférico' },
                { value: 'REDE', label: 'Rede' },
                { value: 'MÓVEL', label: 'Móvel' },
                { value: 'SOFTWARE', label: 'Software' },
                { value: 'SERVIDOR', label: 'Servidor' },
                { value: 'CONSUMÍVEL', label: 'Consumível' },
              ]}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            />
            <Select
              label="Status"
              options={[
                { value: 'DISPONÍVEL', label: 'Disponível' },
                { value: 'EM_USO', label: 'Em Uso' },
                { value: 'MANUTENÇÃO', label: 'Manutenção' },
                { value: 'APOSENTADO', label: 'Aposentado' },
              ]}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            />
            <Input
              label="Buscar"
              type="text"
              placeholder="Buscar por nome ou código..."
            />
          </div>
        </Card>

        {/* Lista de Ativos - Grid */}
        {isLoading ? (
          <Loading message="Carregando ativos..." />
        ) : assets.length === 0 ? (
          <EmptyState
            title="Nenhum ativo encontrado"
            description="Nenhum ativo corresponde aos filtros selecionados"
            action={
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Registrar Primeiro Ativo
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-md transition cursor-pointer">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{getAssetTypeIcon(asset.asset_type)}</div>
                  <h3 className="font-semibold text-gray-900 text-lg">{asset.name}</h3>
                  <p className="text-sm text-gray-500">Código: {asset.code}</p>
                </div>

                <div className="space-y-3 border-t border-b border-gray-200 py-3 my-3">
                  <div>
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="font-medium text-gray-900">{asset.asset_type}</p>
                  </div>
                  {asset.model && (
                    <div>
                      <p className="text-xs text-gray-500">Modelo</p>
                      <p className="font-medium text-gray-900">{asset.model}</p>
                    </div>
                  )}
                  {asset.manufacturer && (
                    <div>
                      <p className="text-xs text-gray-500">Fabricante</p>
                      <p className="font-medium text-gray-900">{asset.manufacturer}</p>
                    </div>
                  )}
                  {asset.serial_number && (
                    <div>
                      <p className="text-xs text-gray-500">Serial</p>
                      <p className="font-medium text-gray-900 text-sm break-all">{asset.serial_number}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        getAssetStatusColor(asset.status).bg
                      } ${getAssetStatusColor(asset.status).text}`}
                    >
                      {asset.status}
                    </span>
                  </div>
                  {asset.created_at && (
                    <p className="text-xs text-gray-500">
                      Registrado em {formatDate(asset.created_at)}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    Detalhes
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
        title="Registrar Novo Ativo"
        onClose={() => setShowCreateModal(false)}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateAsset}
              isLoading={createAsset.isPending}
            >
              Registrar Ativo
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Código do Ativo"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="EX: HW-2024-001"
            required
          />
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Descrição do ativo"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              options={[
                { value: 'HARDWARE', label: 'Hardware' },
                { value: 'PERIFÉRICO', label: 'Periférico' },
                { value: 'REDE', label: 'Rede' },
                { value: 'MÓVEL', label: 'Móvel' },
                { value: 'SOFTWARE', label: 'Software' },
                { value: 'SERVIDOR', label: 'Servidor' },
                { value: 'CONSUMÍVEL', label: 'Consumível' },
              ]}
              value={formData.asset_type}
              onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as AssetType })}
            />
            <Select
              label="Status"
              options={[
                { value: 'DISPONÍVEL', label: 'Disponível' },
                { value: 'EM_USO', label: 'Em Uso' },
                { value: 'MANUTENÇÃO', label: 'Manutenção' },
                { value: 'APORENTADO', label: 'Aposentado' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
            />
          </div>
          <Input
            label="Número Serial"
            value={formData.serial_number}
            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
            placeholder="(Opcional)"
          />
          <Input
            label="Modelo"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="(Opcional)"
          />
          <Input
            label="Fabricante"
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            placeholder="(Opcional)"
          />
        </form>
      </Modal>
    </Layout>
  )
}
