import { useNavigate } from 'react-router-dom'
import useNotifStore from '../context/notifStore'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmptyState } from '../components/ui'

const ICONS = {
  match_request: '💌',
  request_accepted: '🎉',
  request_rejected: '😔',
  group_invite: '👥',
  join_request: '🚪',
  message: '💬',
  listing_request: '🏠',
  review: '⭐',
  report: '🚨',
  system: '📢',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, unread, markRead, markAllRead } = useNotifStore()

  // FIX: redirecciones correctas según el tipo de notificación
  const handleClick = (n) => {
    markRead(n.id)
    const d = n.data || {}

    // Mensaje → ir al chat
    if (n.type === 'message' && d.chat_id) {
      return navigate(`/chat/${d.chat_id}`)
    }

    // Invitación o solicitud de grupo → ir al grupo
    if ((n.type === 'group_invite' || n.type === 'join_request') && d.group_id) {
      return navigate(`/groups/${d.group_id}`)
    }

    // Solicitud de roomie → ir al perfil del emisor con el request_id en state
    if (n.type === 'match_request' && d.sender_id) {
      return navigate(`/profile/${d.sender_id}`, {
        state: { pendingRequestId: d.request_id },
      })
    }

    // Solicitud aceptada → ir al perfil del nuevo roomie
    if (n.type === 'request_accepted' && d.sender_id) {
      return navigate(`/profile/${d.sender_id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-3xl">
          Notificaciones{' '}
          {unread > 0 && <span className="text-primary-500">({unread})</span>}
        </h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-sm">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="Sin notificaciones"
          description="Cuando alguien te contacte aparecerá aquí."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left card flex items-start gap-4 transition-all hover:shadow-md
                ${!n.read ? 'border-primary-300 bg-primary-50/50' : ''}`}
            >
              <span className="text-2xl mt-0.5">{ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{n.title}</p>
                {n.content && (
                  <p className="text-sm text-gray-500 mt-0.5">{n.content}</p>
                )}
                <p className="text-xs text-orange-300 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), {
                    locale: es,
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage