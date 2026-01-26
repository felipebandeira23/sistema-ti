import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Asset {
  id: string
  code: string
  name: string
  asset_type: string
  status: string
  serial_number?: string
}

interface AssetsPageProps {
  token: string
}

export function AssetsPage({ token }: AssetsPageProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAssets(response.data)
    } catch (error) {
      console.error('Erro ao buscar ativos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      HARDWARE: '💻',
      PERIFÉRICO: '🖱️',
      REDE: '🌐',
      MÓVEL: '📱',
      SOFTWARE: '📦',
      SERVIDOR: '🖥️',
      CONSUMÍVEL: '📄',
    }
    return icons[type] || '📦'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONÍVEL':
        return 'bg-green-100 text-green-800'
      case 'EM_USO':
        return 'bg-blue-100 text-blue-800'
      case 'MANUTENÇÃO':
        return 'bg-yellow-100 text-yellow-800'
      case 'APOSENTADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Inventário de Ativos</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.length === 0 ? (
            <div className="col-span-full bg-white p-6 rounded-lg shadow text-center text-gray-500">
              Nenhum ativo encontrado
            </div>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{getTypeIcon(asset.asset_type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{asset.code}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="ml-2 font-medium">{asset.asset_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                  {asset.serial_number && (
                    <div>
                      <span className="text-gray-600">Serial:</span>
                      <span className="ml-2 font-mono text-xs">{asset.serial_number}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
