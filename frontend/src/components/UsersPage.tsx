import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface UserItem {
  id: string
  username: string
  full_name: string
  email: string
  department?: string
  phone?: string
  is_active: boolean
  roles: string[]
  last_login?: string
  source?: string // LDAP or LOCAL
}

interface UsersPageProps {
  token: string
}

interface CreateUserForm {
  username: string
  full_name: string
  email: string
  password: string
  department: string
  roles: string[]
}

interface EditUserForm {
  full_name: string
  email: string
  department: string
  phone: string
}

const INITIAL_CREATE: CreateUserForm = {
  username: '',
  full_name: '',
  email: '',
  password: '',
  department: '',
  roles: [],
}

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-800',
  tecnico: 'bg-green-100 text-green-800',
  usuario: 'bg-gray-100 text-gray-700',
}

const ALL_ROLES = ['admin', 'tecnico', 'usuario']

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface CreateUserModalProps {
  token: string
  onClose: () => void
  onCreated: () => void
}

function CreateUserModal({ token, onClose, onCreated }: CreateUserModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<CreateUserForm>(INITIAL_CREATE)
  const [submitting, setSubmitting] = useState(false)

  const toggleRole = (role: string) => {
    setForm((p) => ({
      ...p,
      roles: p.roles.includes(role) ? p.roles.filter((r) => r !== role) : [...p.roles, role],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim()) { toast.warning('Username é obrigatório'); return }
    if (!form.full_name.trim()) { toast.warning('Nome completo é obrigatório'); return }
    if (!form.email.trim()) { toast.warning('E-mail é obrigatório'); return }
    if (!form.password) { toast.warning('Senha é obrigatória'); return }
    setSubmitting(true)
    try {
      await axios.post(
        '/api/users/',
        {
          username: form.username.trim(),
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          department: form.department.trim() || undefined,
          roles: form.roles.length > 0 ? form.roles : ['usuario'],
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Usuário criado com sucesso!')
      onCreated()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao criar usuário')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo Usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="nome.sobrenome"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Nome Sobrenome"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="usuario@empresa.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="Ex: TI, RH, Financeiro"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Perfis</label>
              <div className="flex flex-wrap gap-3">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {role}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            form="create-user-form"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
          >
            {submitting
              ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Criando...</>
              : 'Criar Usuário'}
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

interface EditUserModalProps {
  user: UserItem
  token: string
  onClose: () => void
  onUpdated: () => void
}

function EditUserModal({ user, token, onClose, onUpdated }: EditUserModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<EditUserForm>({
    full_name: user.full_name,
    email: user.email,
    department: user.department ?? '',
    phone: user.phone ?? '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.warning('Nome completo é obrigatório'); return }
    if (!form.email.trim()) { toast.warning('E-mail é obrigatório'); return }
    setSubmitting(true)
    try {
      await axios.patch(
        `/api/users/${user.id}`,
        {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          department: form.department.trim() || undefined,
          phone: form.phone.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success('Usuário atualizado com sucesso!')
      onUpdated()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao atualizar usuário')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Editar Usuário</h2>
            <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+55 21 99999-9999"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="submit"
            form="edit-user-form"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium flex items-center gap-2"
          >
            {submitting
              ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Salvando...</>
              : 'Salvar Alterações'}
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

export function UsersPage({ token }: UsersPageProps) {
  const toast = useToast()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/users/', { headers })
      setUsers(Array.isArray(res.data) ? res.data : res.data.items ?? [])
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const toggleActive = async (user: UserItem) => {
    setTogglingId(user.id)
    try {
      await axios.patch(
        `/api/users/${user.id}`,
        { is_active: !user.is_active },
        { headers },
      )
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)),
      )
      toast.success(`Usuário ${!user.is_active ? 'ativado' : 'desativado'} com sucesso`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao alterar status')
    } finally {
      setTogglingId(null)
    }
  }

  const lowerSearch = search.toLowerCase()
  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(lowerSearch) ||
      u.username.toLowerCase().includes(lowerSearch) ||
      u.email.toLowerCase().includes(lowerSearch),
  )

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {showCreate && (
        <CreateUserModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={fetchUsers}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          token={token}
          onClose={() => setEditingUser(null)}
          onUpdated={fetchUsers}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-gray-500 text-sm mt-0.5">Cadastro e controle de acesso de usuários do sistema</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex-shrink-0"
        >
          + Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, username ou e-mail..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </h3>
          <p className="text-gray-400 text-sm">
            {search ? 'Tente outro termo de busca.' : 'Clique em "+ Novo Usuário" para começar.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{filtered.length} usuário(s) encontrado(s)</p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nome', 'Username', 'E-mail', 'Departamento', 'Perfis', 'Status', 'Último Acesso', 'Ações'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[120px]">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">@{u.username}</td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.department ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((role) => (
                          <span
                            key={role}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={togglingId === u.id}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                          u.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } disabled:opacity-50`}
                        title={u.is_active ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        {togglingId === u.id ? '...' : u.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.last_login)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium transition px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
