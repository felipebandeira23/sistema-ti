import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import './styles/globals.css'
import { LoginForm } from './components/LoginForm'
import { TicketsPage } from './components/TicketsPage'
import { AssetsPage } from './components/AssetsPage'
import { KnowledgePage } from './components/KnowledgePage'
import { CMDBPage } from './components/CMDBPage'
import { ServiceCatalogPage } from './components/ServiceCatalogPage'
import { ApprovalsPage } from './components/ApprovalsPage'
import { SLAPage } from './components/SLAPage'

interface UserData {
  user_id: string
  username: string
  email: string
  full_name: string
  roles: string[]
}

function App() {
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Tentar recuperar dados da sessão anterior
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
  }

  if (!user || !token) {
    return <LoginForm onLoginSuccess={(data) => {
      setUser(data)
      setToken(data.token.access_token)
    }} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">COPPEAD ITSM</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow min-h-screen">
            <nav className="p-4 space-y-2">
              <NavLink to="/" label="Dashboard" icon="📊" />
              <NavLink to="/tickets" label="Tickets" icon="🎫" />
              <NavLink to="/assets" label="Inventário" icon="📦" />
              <NavLink to="/cmdb" label="CMDB" icon="⚙️" />
              <NavLink to="/catalog" label="Catálogo" icon="📋" />
              <NavLink to="/knowledge" label="Base de Conhecimento" icon="📚" />
              <NavLink to="/approvals" label="Aprovações" icon="✅" />
              <NavLink to="/sla" label="SLA" icon="⏱️" />
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/tickets" element={<TicketsPage token={token} />} />
              <Route path="/assets" element={<AssetsPage token={token} />} />
              <Route path="/knowledge" element={<KnowledgePage token={token} />} />
              <Route path="/cmdb" element={<CMDBPage token={token} />} />
              <Route path="/catalog" element={<ServiceCatalogPage token={token} />} />
              <Route path="/approvals" element={<ApprovalsPage token={token} />} />
              <Route path="/sla" element={<SLAPage token={token} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

function NavLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link
      to={to}
      className="block px-4 py-3 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition"
    >
      <span className="text-lg mr-2">{icon}</span>
      {label}
    </Link>
  )
}

function Dashboard({ user }: { user: UserData }) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo, {user.full_name}!</h2>
        <p className="text-gray-600">Aqui você pode gerenciar todos os aspectos de TI da COPPEAD</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card
          title="Tickets"
          icon="🎫"
          description="Gerenciar incidentes, requisições e problemas"
          to="/tickets"
        />
        <Card
          title="Inventário"
          icon="📦"
          description="Controlar ativos de TI"
          to="/assets"
        />
        <Card title="CMDB" icon="⚙️" description="Configuração de itens" to="/cmdb" />
        <Card
          title="Catálogo"
          icon="📋"
          description="Serviços disponíveis"
          to="/catalog"
        />
        <Card
          title="Base de Conhecimento"
          icon="📚"
          description="FAQ e documentação"
          to="/knowledge"
        />
        <Card
          title="Aprovações"
          icon="✅"
          description="Fluxos de aprovação"
          to="/approvals"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Status do Sistema</h3>
          <div className="space-y-3">
            <StatusItem label="Backend API" status="online" />
            <StatusItem label="Banco de Dados" status="online" />
            <StatusItem label="Redis Cache" status="online" />
            <StatusItem label="Autenticação LDAP" status="online" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Informações do Usuário</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Nome:</span> {user.full_name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-medium">Usuário:</span> {user.username}
            </p>
            <p>
              <span className="font-medium">Perfis:</span>
              <div className="mt-2 flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({
  title,
  icon,
  description,
  to,
}: {
  title: string
  icon: string
  description: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer block"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">{description}</p>
    </Link>
  )
}

function StatusItem({ label, status }: { label: string; status: string }) {
  const statusColor = status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
        {status === 'online' ? '✓ Online' : '✗ Offline'}
      </span>
    </div>
  )
}

export default App
