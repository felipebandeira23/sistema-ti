import { TicketPriority, TicketStatus, TicketType, AssetType, AssetStatus } from '../types'

// ============ CORES E ESTILOS ============

export const getPriorityColor = (priority: TicketPriority) => {
  const colors: Record<TicketPriority, { bg: string; text: string }> = {
    CRÍTICA: { bg: 'bg-red-100', text: 'text-red-800' },
    ALTA: { bg: 'bg-orange-100', text: 'text-orange-800' },
    MÉDIA: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    BAIXA: { bg: 'bg-green-100', text: 'text-green-800' },
  }
  return colors[priority] || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export const getStatusColor = (status: TicketStatus) => {
  const colors: Record<TicketStatus, { bg: string; text: string }> = {
    ABERTO: { bg: 'bg-blue-100', text: 'text-blue-800' },
    EM_PROGRESSO: { bg: 'bg-purple-100', text: 'text-purple-800' },
    AGUARDANDO_USUARIO: { bg: 'bg-orange-100', text: 'text-orange-800' },
    RESOLVIDO: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    FECHADO: { bg: 'bg-green-100', text: 'text-green-800' },
  }
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export const getSLAColor = (slaStatus: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    OK: { bg: 'bg-green-100', text: 'text-green-800' },
    ALERTA: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    VIOLADO: { bg: 'bg-red-100', text: 'text-red-800' },
  }
  return colors[slaStatus] || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export const getAssetStatusColor = (status: AssetStatus) => {
  const colors: Record<AssetStatus, { bg: string; text: string }> = {
    DISPONÍVEL: { bg: 'bg-green-100', text: 'text-green-800' },
    EM_USO: { bg: 'bg-blue-100', text: 'text-blue-800' },
    MANUTENÇÃO: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    APOSENTADO: { bg: 'bg-red-100', text: 'text-red-800' },
  }
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

// ============ ÍCONES ============

export const getPriorityIcon = (priority: TicketPriority) => {
  const icons: Record<TicketPriority, string> = {
    CRÍTICA: '🔴',
    ALTA: '🟠',
    MÉDIA: '🟡',
    BAIXA: '🟢',
  }
  return icons[priority] || '⚪'
}

export const getStatusIcon = (status: TicketStatus) => {
  const icons: Record<TicketStatus, string> = {
    ABERTO: '📂',
    EM_PROGRESSO: '⏳',
    AGUARDANDO_USUARIO: '⏸️',
    RESOLVIDO: '✓',
    FECHADO: '✓✓',
  }
  return icons[status] || '📌'
}

export const getTicketTypeIcon = (type: TicketType) => {
  const icons: Record<TicketType, string> = {
    INCIDENTE: '🚨',
    REQUISIÇÃO: '📋',
    PROBLEMA: '🔧',
    MUDANÇA: '🔄',
  }
  return icons[type] || '🎫'
}

export const getAssetTypeIcon = (type: AssetType) => {
  const icons: Record<AssetType, string> = {
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

// ============ FORMATAÇÃO ============

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatRelativeTime = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'agora mesmo'
  if (diffMins < 60) return `${diffMins}m atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`

  return formatDate(dateString)
}

export const formatTimeRemaining = (hours: number) => {
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  const minutes = Math.floor((remainingHours * 60) % 60)

  if (days > 0) return `${days}d ${remainingHours}h`
  if (remainingHours > 0) return `${remainingHours}h ${minutes}m`
  return `${minutes}m`
}

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const formatPercentage = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`
}

// ============ VALIDAÇÃO ============

export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const isValidURL = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ============ STRING UTILS ============

export const truncate = (text: string, length: number) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export const capitalize = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const toTitleCase = (text: string) => {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ============ NÚMERO UTILS ============

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
