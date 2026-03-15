import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, MessageCircle, LogOut, Users, MapPin } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../context/authStore'
import { Avatar, Badge, Spinner, EmptyState } from '../components/ui'
import { toast } from 'react-hot-toast'

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/groups/${id}`)
      .then(({ data }) => setGroup(data.group))
      .catch(() => navigate('/groups'))
      .finally(() => setLoading(false))
  }, [id])

  const isMember = group?.members?.some(m => m.user_id === user?.id)
  const isAdmin  = group?.members?.some(m => m.user_id === user?.id && m.role === 'admin')

  const handleJoin = async () => {
    try {
      const { data } = await api.post(`/groups/${id}/join`)
      setGroup(data.group)
      toast.success('Te uniste al grupo')
    } catch (e) { toast.error(e.response?.data?.error || 'Error') }
  }

  const handleLeave = async () => {
    try {
      await api.post(`/groups/${id}/leave`)
      toast.success('Saliste del grupo')
      navigate('/groups')
    } catch (e) { toast.error(e.response?.data?.error || 'Error') }
  }

  const handleOpenChat = async () => {
    try {
      // Find the group chat via chats list
      const { data } = await api.get('/chats/')
      const groupChat = data.chats.find(c => c.group_id === parseInt(id))
      if (groupChat) navigate(`/chat/${groupChat.id}`)
      else toast.error('Chat no encontrado')
    } catch { toast.error('Error al abrir chat') }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!group) return null

  const pct = Math.round((group.current_members / group.max_members) * 100)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/groups" className="flex items-center gap-1 text-orange-400 hover:text-primary-600 mb-6 text-sm font-semibold transition-colors">
        <ChevronLeft size={16} /> Volver a grupos
      </Link>

      {/* Header card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={group.status === 'open' ? 'green' : 'gray'}>{group.status}</Badge>
              {isAdmin && <Badge variant="dark">Admin</Badge>}
            </div>
            <h1 className="font-display font-extrabold text-3xl">{group.name}</h1>
            <div className="flex items-center gap-1 text-orange-400 text-sm mt-1">
              <MapPin size={14} /> {group.city}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isMember ? (
              <>
                <button onClick={handleOpenChat} className="btn-primary flex items-center gap-2 text-sm">
                  <MessageCircle size={14} /> Chat del grupo
                </button>
                {!isAdmin && (
                  <button onClick={handleLeave} className="btn-secondary flex items-center gap-2 text-sm border-red-300 text-red-500 hover:bg-red-50">
                    <LogOut size={14} /> Salir del grupo
                  </button>
                )}
              </>
            ) : !group.is_full ? (
              <button onClick={handleJoin} className="btn-primary flex items-center gap-2 text-sm">
                <Users size={14} /> Unirme al grupo
              </button>
            ) : (
              <Badge variant="gray">Grupo lleno</Badge>
            )}
          </div>
        </div>

        {group.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{group.description}</p>
        )}

        {/* Capacity bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-orange-500 flex items-center gap-1">
              <Users size={14} /> {group.current_members} / {group.max_members} miembros
            </span>
            <span className="text-xs text-orange-300">{group.max_members - group.current_members} lugar{group.max_members - group.current_members !== 1 ? 'es' : ''} disponible{group.max_members - group.current_members !== 1 ? 's' : ''}</span>
          </div>
          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Preferences */}
        <div className="flex flex-wrap gap-2 mt-4">
          {group.budget_max && (
            <Badge variant="dark">₲ máx. {(group.budget_max / 1_000_000).toFixed(1)}M</Badge>
          )}
          {group.pets_allowed && <Badge variant="orange">🐾 Mascotas ok</Badge>}
          {group.smoking_allowed && <Badge variant="gray">🚬 Fumadores ok</Badge>}
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <h2 className="font-display font-bold text-xl mb-5">Miembros del grupo</h2>
        {group.members.length === 0 ? (
          <EmptyState icon="👤" title="Sin miembros" />
        ) : (
          <div className="space-y-4">
            {group.members.map(m => (
              <div key={m.user_id} className="flex items-center gap-3">
                <Avatar
                  src={m.profile?.profile_photo_url}
                  name={m.profile?.name}
                  size="md"
                  verified={m.profile?.verified}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${m.user_id}`} className="font-semibold hover:text-primary-600 transition-colors">
                      {m.profile?.name || `Usuario #${m.user_id}`}
                    </Link>
                    {m.role === 'admin' && <Badge variant="dark">Admin</Badge>}
                    {m.profile?.verified && <Badge variant="green">✓</Badge>}
                  </div>
                  {m.profile?.profession && (
                    <p className="text-xs text-orange-400">{m.profile.profession}</p>
                  )}
                </div>
                {m.user_id !== user?.id && (
                  <Link to={`/profile/${m.user_id}`} className="btn-ghost text-xs py-1.5 px-3">
                    Ver perfil
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
