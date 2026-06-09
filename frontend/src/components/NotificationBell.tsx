import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useToast } from '../contexts/ToastContext'

interface Notification {
  id: string
  type: string // approval | sla_warning | ticket_assigned
  title: string
  message: string
  created_at: string | null
  read: boolean
}

interface NotificationBellProps {
  token: string
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  return `há ${Math.floor(hours / 24)}d`
}

function typeIcon(type: string): string {
  switch (type) {
    case 'approval': return '✅'
    case 'sla_warning': return '⚠️'
    case 'ticket_assigned': return '🎫'
    default: return '🔔'
  }
}

export function NotificationBell({ token }: NotificationBellProps) {
  const toast = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get('/api/notifications/', { headers })
      const data: Notification[] = Array.isArray(res.data) ? res.data : res.data.items ?? []
      // Sort by date descending
      data.sort((a, b) => {
        if (!a.created_at) return 1
        if (!b.created_at) return -1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setNotifications(data)
    } catch {
      // silent — bell should not spam errors
    }
  }, [token])

  // Initial fetch + 60s polling
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  const markRead = async (id: string) => {
    try {
      await axios.post(`/api/notifications/${id}/read`, {}, { headers })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast.error(axiosErr.response?.data?.detail ?? 'Erro ao marcar notificação')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const visible = notifications.slice(0, 10)

  return (
    <div ref={wrapperRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition focus:outline-none"
        aria-label="Notificações"
      >
        <span className="text-xl leading-none">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-80 w-96 max-w-[calc(100vw-1rem)] bg-white shadow-xl rounded-xl border border-gray-200 z-50 flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <span className="font-semibold text-gray-900 text-sm">Notificações</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-3xl mb-2">✔️</span>
                <p className="text-sm font-medium">Nenhuma notificação</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {visible.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => { if (!n.read) markRead(n.id) }}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition hover:bg-gray-50 ${
                      !n.read ? 'border-l-4 border-blue-500 bg-blue-50/40' : ''
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-900 truncate ${!n.read ? 'font-semibold' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{relativeTime(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 flex-shrink-0">
            <div className="relative group inline-block w-full">
              <button
                disabled
                className="w-full text-center text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition py-1"
              >
                Ver todas
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                Em breve
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
