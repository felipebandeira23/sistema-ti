import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface License {
  id: string
  software_name: string
  version?: string
  quantity: number
  issued_date: string
  expiry_date: string
  vendor?: string
  cost?: number
  days_left: number
  expiry_status: 'ok' | 'warning' | 'critical' | 'expired'
}

interface Contract {
  id: string
  asset_id: string
  vendor: string
  contract_number: string
  start_date: string
  end_date: string
  cost?: number
  coverage?: string
}

interface LicensingPageProps {
  token: string
}

interface LicenseFormData {
  software_name: string
  version: string
  vendor: string
  quantity: string
  issued_date: string
  expiry_date: string
  cost: string
}

interface ContractFormData {
  asset_id: string
  vendor: string
  contract_number: string
  start_date: string
  end_date: string
  coverage: string
  cost: string
}

const INITIAL_LICENSE_FORM: LicenseFormData = {
  software_name: '',
  version: '',
  vendor: '',
  quantity: '',
  issued_date: '',
  expiry_date: '',
  cost: '',
}

const INITIAL_CONTRACT_FORM: ContractFormData = {
  asset_id: '',
  vendor: '',
  contract_number: '',
  start_date: '',
  end_date: '',
  coverage: '',
  cost: '',
}

const EXPIRY_BADGE: Record<string, string> = {
  ok: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-orange-100 text-orange-800',
  expired: 'bg-red-100 text-red-800',
}

const EXPIRY_LABELS: Record<string, string> = {
  ok: 'OK',
  warning: 'Atenção',
  critical: 'Crítico',
  expired: 'Vencida',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function daysLeftLabel(license: License): string {
  if (license.expiry_status === 'expired') {
    const absDays = Math.abs(license.days_left)
    return `Vencida há ${absDays} dia${absDays !== 1 ? 's' : ''}`
  }
  return `${license.days_left} dia${license.days_left !== 1 ? 's' : ''}`
}

interface LicenseModalProps {
  token: string
  onClose: () => void
  onCreated: () => void
}

function LicenseModal({ token, onClose, onCreated }: LicenseModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<LicenseFormData>(INITIAL_LICENSE_FORM)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.software_name.trim()) { toast.warning('Nome do software é obrigatório'); return }
    if (!form.quantity || isNaN(Number(form.quantity))) { toast.warning('Quantidade inválida'); return }
    if (!form.issued_date) { toast.warning('Data de emissão é obrigatória'); return }
    if (!form.expiry_date) { toast.warning('Data de vencimento é obrigatória'); return }
    setSubmitting(true)
    try {
      await axios.post(
        '/api/licensing/licenses/',
        {
          software_name: form.software_name.trim(),
          version: form.version.trim() || undefined,
          vendor: form.vendor.trim() || undefined,
          quantity: Number(form.quantity),
          issued_date: form.issued_date,
          expiry_date: form.expiry_date,
          cost: form.cost ? Number(form.cost) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Licença criada com sucesso!')
      onCreated()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar licença')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    label: string,
    key: keyof LicenseFormData,
    opts: { type?: string; required?: boolean; placeholder?: string } = {},
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {opts.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={opts.type ?? 'text'}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={opts.placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nova Licença de Software</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="license-form" onSubmit={handleSubmit} className="space-y-4">
            {field('Nome do Software', 'software_name', { required: true, placeholder: 'Ex: Microsoft Office' })}
            <div className="grid grid-cols-2 gap-4">
              {field('Versão', 'version', { placeholder: 'Ex: 2021' })}
              {field('Fornecedor', 'vendor', { placeholder: 'Ex: Microsoft' })}
            </div>
            {field('Quantidade', 'quantity', { type: 'number', required: true, placeholder: '1' })}
            <div className="grid grid-cols-2 gap-4">
              {field('Data de Emissão', 'issued_date', { type: 'date', required: true })}
              {field('Data de Vencimento', 'expiry_date', { type: 'date', required: true })}
            </div>
            {field('Custo (R$)', 'cost', { type: 'number', placeholder: '0.00' })}
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            form="license-form"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
          >
            {submitting
              ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</>
              : 'Criar Licença'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

interface ContractModalProps {
  token: string
  onClose: () => void
  onCreated: () => void
}

function ContractModal({ token, onClose, onCreated }: ContractModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<ContractFormData>(INITIAL_CONTRACT_FORM)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendor.trim()) { toast.warning('Fornecedor é obrigatório'); return }
    if (!form.contract_number.trim()) { toast.warning('Número do contrato é obrigatório'); return }
    if (!form.start_date) { toast.warning('Data de início é obrigatória'); return }
    if (!form.end_date) { toast.warning('Data de término é obrigatória'); return }
    setSubmitting(true)
    try {
      await axios.post(
        '/api/licensing/contracts/',
        {
          asset_id: form.asset_id.trim() || undefined,
          vendor: form.vendor.trim(),
          contract_number: form.contract_number.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
          coverage: form.coverage.trim() || undefined,
          cost: form.cost ? Number(form.cost) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Contrato criado com sucesso!')
      onCreated()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar contrato')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    label: string,
    key: keyof ContractFormData,
    opts: { type?: string; required?: boolean; placeholder?: string } = {},
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {opts.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={opts.type ?? 'text'}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={opts.placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Contrato de Manutenção</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="contract-form" onSubmit={handleSubmit} className="space-y-4">
            {field('Fornecedor', 'vendor', { required: true, placeholder: 'Ex: Dell Technologies' })}
            {field('Número do Contrato', 'contract_number', { required: true, placeholder: 'Ex: CTR-2024-001' })}
            {field('ID do Ativo', 'asset_id', { placeholder: 'UUID do ativo vinculado' })}
            <div className="grid grid-cols-2 gap-4">
              {field('Data de Início', 'start_date', { type: 'date', required: true })}
              {field('Data de Término', 'end_date', { type: 'date', required: true })}
            </div>
            {field('Cobertura', 'coverage', { placeholder: 'Ex: Hardware + mão de obra' })}
            {field('Custo (R$)', 'cost', { type: 'number', placeholder: '0.00' })}
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            form="contract-form"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
          >
            {submitting
              ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</>
              : 'Criar Contrato'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

type TabId = 'licenses' | 'contracts'

export function LicensingPage({ token }: LicensingPageProps) {
  const toast = useToast()
  const [tab, setTab] = useState<TabId>('licenses')
  const [licenses, setLicenses] = useState<License[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loadingLicenses, setLoadingLicenses] = useState(true)
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchLicenses = useCallback(async () => {
    setLoadingLicenses(true)
    try {
      const res = await axios.get('/api/licensing/licenses/', { headers })
      setLicenses(Array.isArray(res.data) ? res.data : res.data.items ?? [])
    } catch {
      toast.error('Erro ao carregar licenças')
    } finally {
      setLoadingLicenses(false)
    }
  }, [token])

  const fetchContracts = useCallback(async () => {
    setLoadingContracts(true)
    try {
      const res = await axios.get('/api/licensing/contracts/', { headers })
      setContracts(Array.isArray(res.data) ? res.data : res.data.items ?? [])
    } catch {
      toast.error('Erro ao carregar contratos')
    } finally {
      setLoadingContracts(false)
    }
  }, [token])

  useEffect(() => { fetchLicenses() }, [fetchLicenses])
  useEffect(() => { fetchContracts() }, [fetchContracts])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {showLicenseModal && (
        <LicenseModal
          token={token}
          onClose={() => setShowLicenseModal(false)}
          onCreated={fetchLicenses}
        />
      )}
      {showContractModal && (
        <ContractModal
          token={token}
          onClose={() => setShowContractModal(false)}
          onCreated={fetchContracts}
        />
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Licenças & Contratos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Gerenciamento de licenças de software e contratos de manutenção</p>
        </div>
        {tab === 'licenses' ? (
          <button
            onClick={() => setShowLicenseModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex-shrink-0"
          >
            + Nova Licença
          </button>
        ) : (
          <button
            onClick={() => setShowContractModal(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex-shrink-0"
          >
            + Novo Contrato
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {([
          { id: 'licenses' as TabId, label: 'Licenças de Software', icon: '🔑' },
          { id: 'contracts' as TabId, label: 'Contratos de Manutenção', icon: '📄' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Licenses tab */}
      {tab === 'licenses' && (
        loadingLicenses ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : licenses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🔑</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma licença cadastrada</h3>
            <p className="text-gray-400 text-sm">Clique em "+ Nova Licença" para começar.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Software', 'Versão', 'Fornecedor', 'Quantidade', 'Vencimento', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{lic.software_name}</td>
                      <td className="px-4 py-3 text-gray-500">{lic.version ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{lic.vendor ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{lic.quantity}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{formatDate(lic.expiry_date)}</div>
                        <div className={`text-xs mt-0.5 ${lic.expiry_status === 'expired' ? 'text-red-500' : 'text-gray-400'}`}>
                          {daysLeftLabel(lic)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${EXPIRY_BADGE[lic.expiry_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {EXPIRY_LABELS[lic.expiry_status] ?? lic.expiry_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {licenses.map((lic) => (
                <div key={lic.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{lic.software_name}</p>
                      {lic.version && <p className="text-xs text-gray-400">v{lic.version}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${EXPIRY_BADGE[lic.expiry_status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {EXPIRY_LABELS[lic.expiry_status] ?? lic.expiry_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div><span className="text-xs text-gray-400 block">Fornecedor</span>{lic.vendor ?? '—'}</div>
                    <div><span className="text-xs text-gray-400 block">Qtd</span>{lic.quantity}</div>
                    <div><span className="text-xs text-gray-400 block">Vencimento</span>{formatDate(lic.expiry_date)}</div>
                    <div><span className="text-xs text-gray-400 block">Prazo</span>{daysLeftLabel(lic)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* Contracts tab */}
      {tab === 'contracts' && (
        loadingContracts ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum contrato cadastrado</h3>
            <p className="text-gray-400 text-sm">Clique em "+ Novo Contrato" para começar.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Fornecedor', 'Número', 'Ativo', 'Início', 'Fim', 'Cobertura'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.vendor}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{c.contract_number}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[120px]" title={c.asset_id}>
                      {c.asset_id ? `${c.asset_id.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.end_date)}</td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[160px]">{c.coverage ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
