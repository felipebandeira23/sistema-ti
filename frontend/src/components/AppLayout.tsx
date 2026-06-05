import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface NavItem {
  label: string
  path: string
  icon: string
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

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-900 text-white z-40 overflow-y-auto transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User card */}
        <div className="mx-4 mb-4 p-3 rounded-lg bg-gray-800 text-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
              {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}

function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user } = useAuthStore()

  return (
    <header className="h-16 bg-white shadow sticky top-0 z-50 flex items-center px-4 gap-4">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl">🏢</span>
        <h1 className="text-xl font-bold text-blue-600 hidden sm:block">COPPEAD ITSM</h1>
      </div>

      <div className="flex-1" />

      {/* User avatar */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 hidden sm:block">{user?.full_name}</span>
        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
          {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  )
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content - offset for fixed sidebar on desktop */}
        <main className="flex-1 md:ml-64 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
