import { create } from 'zustand'
import { User, LoginRequest } from '../types'
import { apiClient } from '../services/api'

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean

  // Actions
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearError: () => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.login(username, password)
      // Backend returns flat fields (user_id, username, email, full_name, roles)
      // plus a nested token object
      const user: User = {
        user_id: response.user_id,
        username: response.username,
        email: response.email,
        full_name: response.full_name,
        roles: response.roles,
        active: true,
        last_login: response.last_login,
      }
      const token = response.token?.access_token ?? null
      set({ user, token, isAuthenticated: true, isLoading: false })
      localStorage.setItem('user', JSON.stringify(user))
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao fazer login'
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await apiClient.logout()
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  },

  setUser: (user: User) => {
    set({ user })
    localStorage.setItem('user', JSON.stringify(user))
  },

  setToken: (token: string) => {
    set({ token })
    apiClient.setToken(token)
    localStorage.setItem('token', token)
  },

  clearError: () => set({ error: null }),

  initializeAuth: () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser)
        apiClient.setToken(savedToken)
        set({
          token: savedToken,
          user,
          isAuthenticated: true,
        })
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },
}))
