import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface NavItem {
  label: string
  path: string
  icon: string
  badge?: number
  role?: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Tickets', path: '/tickets', icon: '🎫' },
  { label: 'Inventário', path: '/assets', icon: '📦' },
  { label: 'CMDB', path: '/cmdb', icon: '⚙️' },
  { label: 'Catálogo', path: '/catalog', icon: '📋' },
  { label: 'Base de Conhecimento', path: '/knowledge', icon: '📚' },
  { label: 'Aprovações', path: '/approvals', icon: '✅' },
  { label: 'SLA', path: '/sla', icon: '⏱️' },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const isAdmin = user?.roles.includes('admin')

  const filteredNavItems = navItems.filter((item) => {
    if (item.role && !item.role.some((r) => user?.roles.includes(r))) {
      return false
    }
    return true
  })

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen shadow-lg fixed left-0 top-16 z-40 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink key={item.path} {...item} isActive={location.pathname === item.path} />
        ))}

        <hr className="my-4 border-gray-700" />

        {isAdmin && (
          <>
            <div className="text-xs font-semibold text-gray-400 px-4 py-2">ADMINISTRAÇÃO</div>
            <NavLink label="Usuários" path="/admin/users" icon="👥" isActive={location.pathname === '/admin/users'} />
            <NavLink label="Auditoria" path="/admin/audit" icon="📋" isActive={location.pathname === '/admin/audit'} />
            <NavLink label="Configurações" path="/admin/settings" icon="⚙️" isActive={location.pathname === '/admin/settings'} />
          </>
        )}

        <hr className="my-4 border-gray-700" />

        <div className="px-4 py-3 rounded-lg bg-gray-800">
          <p className="text-xs text-gray-400">Usuário</p>
          <p className="text-sm font-medium mt-1">{user?.full_name}</p>
          <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
          <button
            onClick={() => logout()}
            className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded transition"
          >
            Sair
          </button>
        </div>
      </nav>
    </aside>
  )
}

interface NavLinkProps {
  label: string
  path: string
  icon: string
  isActive: boolean
  badge?: number
}

function NavLink({ label, path, icon, isActive, badge }: NavLinkProps) {
  return (
    <Link
      to={path}
      className={`block px-4 py-3 rounded-lg transition ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </span>
        {badge && (
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
    </Link>
  )
}

export function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏢</div>
          <h1 className="text-2xl font-bold text-blue-600">COPPEAD ITSM</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Buscar tickets..."
              className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-4 border-l border-gray-200 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.roles.join(', ')}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-64 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

interface PageContainerProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function PageContainer({ title, subtitle, action, children }: PageContainerProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {action}
        </div>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

interface BreadcrumbProps {
  items: Array<{ label: string; path?: string }>
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span>/</span>}
          {item.path ? <Link to={item.path} className="text-blue-600 hover:underline">{item.label}</Link> : <span>{item.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  trend?: { value: number; isPositive: boolean }
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

export function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  }

  return (
    <div className={`${colorMap[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="text-4xl opacity-20">{icon}</div>
      </div>
    </div>
  )
}
