import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './styles/globals.css'
import { useAuthStore } from './stores/authStore'
import { LoginPage } from './pages/LoginPage'
import { TicketsPage } from './components/TicketsPage'
import { AssetsPage } from './components/AssetsPage'
import { KnowledgePage } from './components/KnowledgePage'
import { CMDBPage } from './components/CMDBPage'
import { ServiceCatalogPage } from './components/ServiceCatalogPage'
import { ApprovalsPage } from './components/ApprovalsPage'
import { SLAPage } from './components/SLAPage'
import { AppLayout } from './components/AppLayout'
import { InternalDashboard } from './components/InternalDashboard'
import { ProblemPage } from './components/ProblemPage'
import { ChangePage } from './components/ChangePage'
import { ReportsPage } from './components/ReportsPage'
import { AISearchPage } from './components/AISearchPage'

function App() {
  const { isAuthenticated, token, initializeAuth } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    initializeAuth()
    setHydrated(true)
  }, [initializeAuth])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            isAuthenticated && token ? (
              <AppLayout>
                <Routes>
                  <Route path="/" element={<InternalDashboard />} />
                  <Route path="/tickets" element={<TicketsPage token={token} />} />
                  <Route path="/assets" element={<AssetsPage token={token} />} />
                  <Route path="/knowledge" element={<KnowledgePage token={token} />} />
                  <Route path="/cmdb" element={<CMDBPage token={token} />} />
                  <Route path="/catalog" element={<ServiceCatalogPage token={token} />} />
                  <Route path="/approvals" element={<ApprovalsPage token={token} />} />
                  <Route path="/sla" element={<SLAPage token={token} />} />
                  <Route path="/problems" element={<ProblemPage token={token} />} />
                  <Route path="/changes" element={<ChangePage token={token} />} />
                  <Route path="/reports" element={<ReportsPage token={token} />} />
                  <Route path="/ai-search" element={<AISearchPage token={token} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
