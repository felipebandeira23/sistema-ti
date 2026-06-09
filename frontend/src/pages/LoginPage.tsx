import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Button, Input, Alert } from '../components/shared/UI'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!username.trim()) errors.username = 'Usuário é obrigatório'
    if (!password) errors.password = 'Senha é obrigatória'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!validateForm()) return

    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      // Erro tratado pelo store
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Card de login */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <h1 className="text-3xl font-bold text-white mb-2">COPPEAD</h1>
            <p className="text-blue-100">Sistema de Gerenciamento de TI</p>
          </div>

          {/* Conteúdo */}
          <div className="px-8 py-8">
            {error && (
              <Alert variant="error" title="Erro de autenticação">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Usuário"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setValidationErrors({ ...validationErrors, username: '' })
                }}
                error={validationErrors.username}
                placeholder="Seu usuário LDAP"
                disabled={isLoading}
              />

              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setValidationErrors({ ...validationErrors, password: '' })
                }}
                error={validationErrors.password}
                placeholder="Sua senha"
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {/* Informações adicionais */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-3">Informações padrão para testes:</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs text-gray-700">
                <p><strong>Usuário:</strong> admin</p>
                <p><strong>Senha:</strong> admin123</p>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-gray-500">
              Protegido por autenticação LDAP/AD
            </p>
          </div>
        </div>

        {/* Marca água */}
        <p className="text-center text-blue-100 text-xs mt-8">
          COPPEAD ITSM v1.0 • 2026
        </p>
      </div>
    </div>
  )
}
