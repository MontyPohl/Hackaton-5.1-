import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Edit2, MessageCircle, UserPlus, Flag, MapPin, Briefcase, Calendar } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../context/authStore'
import { Avatar, Badge, StarRating, Modal, Spinner, EmptyState } from '../components/ui'
import { toast } from 'react-hot-toast'

export default function ProfilePage() {
  const { userId } = useParams()
  const { user: me, profile: myProfile } = useAuthStore()
  const navigate = useNavigate()

  const targetId = userId ? parseInt(userId) : me?.id
  const isMe = !userId || parseInt(userId) === me?.id

  const [profile, setProfile] = useState(isMe ? myProfile : null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(!isMe)
  const [reportModal, setReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('fake_profile')
  const [reportDesc, setReportDesc] = useState('')

  useEffect(() => {
    if (!isMe && targetId) {
      api.get(`/profiles/${targetId}`).then(({ data }) => {
        setProfile(data.profile)
        setLoading(false)
      }).catch(() => { toast.error('Perfil no encontrado'); navigate('/') })
    } else {
      setProfile(myProfile)
      setLoading(false)
    }

    api.get(`/reviews/user/${targetId}`).then(({ data }) => setReviews(data.reviews)).catch(() => {})
  }, [targetId])

  const handleSendRequest = async () => {
    try {
      await api.post('/requests/', { target_user_id: targetId, type: 'roommate' })
      toast.success('Solicitud enviada')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al enviar solicitud')
    }
  }

  const handleOpenChat = async () => {
    try {
      const { data } = await api.post(`/chats/private/${targetId}`)
      navigate(`/chat/${data.chat.id}`)
    } catch {
      toast.error('Error al abrir chat')
    }
  }

  const handleReport = async () => {
    try {
      await api.post('/reports/', { reported_user_id: targetId, reason: reportReason, description: reportDesc })
      toast.success('Reporte enviado')
      setReportModal(false)
    } catch {
      toast.error('Error al reportar')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!profile) return <EmptyState icon="👤" title="Perfil no encontrado" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header card */}
      <div className="card mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar src={profile.profile_photo_url} name={profile.name} size="xl" verified={profile.verified} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-extrabold text-2xl">{profile.name}</h1>
                  {profile.verified && <Badge variant="green">✓ Verificado</Badge>}
                  {profile.is_looking && <Badge variant="orange">Buscando</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-orange-400 mt-1 flex-wrap">
                  {profile.age && <span><Calendar size={13} className="inline" /> {profile.age} años</span>}
                  {profile.profession && <span><Briefcase size={13} className="inline" /> {profile.profession}</span>}
                  {profile.city && <span><MapPin size={13} className="inline" /> {profile.city}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isMe ? (
                  <Link to="/profile/edit" className="btn-primary flex items-center gap-1.5 text-sm py-2">
                    <Edit2 size={14} /> Editar perfil
                  </Link>
                ) : (
                  <>
                    <button onClick={handleSendRequest} className="btn-primary flex items-center gap-1.5 text-sm py-2">
                      <UserPlus size={14} /> Solicitar roomie
                    </button>
                    <button onClick={handleOpenChat} className="btn-secondary flex items-center gap-1.5 text-sm py-2">
                      <MessageCircle size={14} /> Chat
                    </button>
                    <button onClick={() => setReportModal(true)}
                      className="p-2 text-orange-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors" title="Reportar">
                      <Flag size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {profile.bio && <p className="text-gray-600 mt-3 text-sm leading-relaxed">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Preferences */}
        <div className="card">
          <h2 className="font-display font-bold text-lg mb-4">Preferencias de convivencia</h2>
          <div className="space-y-3 text-sm">
            {(profile.budget_min || profile.budget_max) && (
              <div className="flex justify-between">
                <span className="text-orange-400">Presupuesto</span>
                <span className="font-semibold">
                  ₲ {profile.budget_min ? (profile.budget_min / 1_000_000).toFixed(1) + 'M' : '?'}
                  {' – '}
                  {profile.budget_max ? (profile.budget_max / 1_000_000).toFixed(1) + 'M' : '?'}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-orange-400">Mascotas</span>
              <span className={profile.pets ? 'text-emerald-600 font-semibold' : 'text-gray-500'}>
                {profile.pets ? '✓ Tiene mascotas' : '✗ Sin mascotas'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-400">Fumador</span>
              <span className={profile.smoker ? 'text-blue-500 font-semibold' : 'text-gray-500'}>
                {profile.smoker ? '🚬 Fumador' : '✗ No fuma'}
              </span>
            </div>
            {profile.schedule && (
              <div className="flex justify-between">
                <span className="text-orange-400">Horario</span>
                <span className="font-semibold capitalize">{profile.schedule}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reviews summary */}
        <div className="card">
          <h2 className="font-display font-bold text-lg mb-4">Reseñas ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-orange-300 text-sm">Sin reseñas aún</p>
          ) : (
            <>
              {reviews.slice(0, 3).map(r => (
                <div key={r.id} className="border-b border-orange-50 pb-3 mb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{r.reviewer_name}</span>
                    <StarRating value={r.rating} />
                  </div>
                  {r.comment && <p className="text-xs text-gray-500">{r.comment}</p>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Verification */}
      {isMe && (
        <div className="card border-dashed border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold">Verificación de identidad</h3>
              <p className="text-sm text-orange-400 mt-0.5">Estado: <span className="font-semibold">{profile.verification_status}</span></p>
            </div>
            {profile.verification_status !== 'verified' && (
              <Link to="/verification" className="btn-primary text-sm py-2 px-4">
                {profile.verification_status === 'not_requested' ? 'Verificar identidad' : 'Ver estado'}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Report modal */}
      <Modal open={reportModal} onClose={() => setReportModal(false)} title="Reportar usuario">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Razón del reporte</label>
            <select className="input" value={reportReason} onChange={e => setReportReason(e.target.value)}>
              {['spam', 'fake_profile', 'harassment', 'inappropriate_content', 'scam', 'hate_speech', 'other'].map(r => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Descripción (opcional)</label>
            <textarea className="input h-24 resize-none" value={reportDesc}
              onChange={e => setReportDesc(e.target.value)} placeholder="Explicá brevemente el problema..." />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setReportModal(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleReport} className="btn-primary bg-red-500 hover:bg-red-600">Reportar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
