import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Edit2, MessageCircle, UserPlus, Flag,
  MapPin, Briefcase, Calendar, ShieldCheck,
} from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../context/authStore'
import { Avatar, Badge, StarRating, Modal, Spinner, EmptyState } from '../components/ui'
import { toast } from 'react-hot-toast'

export default function ProfilePage() {
  const { userId } = useParams()
  const location = useLocation()
  // FIX: usar updateProfile en lugar de setProfile (que no existe en authStore)
  const { user: me, profile: myProfile, updateProfile } = useAuthStore()
  const navigate = useNavigate()

  const targetId = userId ? parseInt(userId) : me?.id
  const isMe = !userId || parseInt(userId) === me?.id

  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportModal, setReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('fake_profile')
  const [reportDesc, setReportDesc] = useState('')
  const [pendingRequest, setPendingRequest] = useState(null)
  const [verification, setVerification] = useState(null)
  const [roommate, setRoommate] = useState(null)
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    setLoading(true)
    setPendingRequest(null)
    setRequestSent(false)

    if (!isMe && targetId) {
      api
        .get(`/profiles/${targetId}`)
        .then(({ data }) => {
          setProfile(data.profile)
          setRoommate(data.profile?.current_roomie ?? null)
          setLoading(false)
        })
        .catch(() => {
          toast.error('Perfil no encontrado')
          navigate('/')
        })

      // FIX: leer pendingRequestId desde React Router state (en lugar de localStorage)
      const pendingIdFromState = location.state?.pendingRequestId
      if (pendingIdFromState) {
        setPendingRequest({ id: pendingIdFromState })
      } else {
        // Fallback: compatibilidad con entradas antiguas de localStorage
        try {
          const stored = JSON.parse(
            localStorage.getItem('lastRequestNotification') || 'null'
          )
          if (stored?.sender_id === targetId) {
            setPendingRequest({ id: stored.request_id })
            localStorage.removeItem('lastRequestNotification')
          }
        } catch {
          // ignorar errores de localStorage
        }
      }
    } else {
      setProfile(myProfile)
      setRoommate(myProfile?.current_roomie ?? null)
      setLoading(false)

      api
        .get('/verification/me')
        .then(({ data }) => setVerification(data.verification))
        .catch(() => setVerification(null))
    }

    if (targetId) {
      api
        .get(`/reviews/user/${targetId}`)
        .then(({ data }) => setReviews(data.reviews))
        .catch(() => { })
    }
  }, [targetId, isMe]) // eslint-disable-line react-hooks/exhaustive-deps

  // Actualizar roommate si myProfile cambia (ej. después de aceptar solicitud)
  useEffect(() => {
    if (isMe && myProfile) {
      setProfile(myProfile)
      setRoommate(myProfile.current_roomie ?? null)
    }
  }, [myProfile, isMe])

  const respondRequest = async (reqId, action) => {
    try {
      const { data } = await api.put(`/requests/${reqId}/respond`, { action })
      if (action === 'accept') {
        toast.success('¡Solicitud aceptada! Ahora son roommates.')
        setRoommate(data.roommate)
        // FIX: updateProfile en lugar de setMyProfile (que no existe)
        // Actualizamos nuestro propio perfil en el store
        updateProfile({
          ...myProfile,
          current_roomie: data.roommate,
          is_looking: false,
        })
      } else {
        toast.success('Solicitud rechazada')
      }
      setPendingRequest(null)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al procesar la solicitud')
    }
  }

  const handleSendRequest = async () => {
    if (requestSent) return
    try {
      await api.post('/requests/', { target_user_id: targetId, type: 'roommate' })
      toast.success('Solicitud enviada correctamente')
      setRequestSent(true)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al enviar solicitud')
    }
  }

  const handleOpenChat = async () => {
    try {
      const { data } = await api.post(`/chats/private/${targetId}`)
      navigate(`/chat/${data.chat.id}`)
    } catch {
      toast.error('Error al abrir el chat')
    }
  }

  const handleReport = async () => {
    try {
      await api.post('/reports/', {
        reported_user_id: targetId,
        reason: reportReason,
        description: reportDesc,
      })
      toast.success('Reporte enviado')
      setReportModal(false)
      setReportDesc('')
    } catch {
      toast.error('Error al enviar el reporte')
    }
  }

  const getVerificationLabel = () => {
    if (!verification || verification.status === 'not_requested')
      return 'Verificar perfil'
    if (verification.status === 'pending_verification' && !verification.selfie_url)
      return 'Subir selfie →'
    if (verification.status === 'pending_verification' && verification.selfie_url)
      return 'Verificación pendiente'
    if (verification.status === 'rejected') return 'Reintentar verificación'
    return 'Verificar perfil'
  }

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  if (!profile)
    return <EmptyState icon="👤" title="Perfil no encontrado" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar
            src={profile.profile_photo_url}
            name={profile.name}
            size="xl"
            verified={profile.verified}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-extrabold text-2xl">
                    {profile.name}
                  </h1>

                  {profile.verified && (
                    <Badge variant="green">✓ Verificado</Badge>
                  )}

                  {isMe && !profile.verified && verification?.status !== 'verified' && (
                    <button
                      onClick={() => navigate('/verification')}
                      className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <ShieldCheck size={14} />
                      {getVerificationLabel()}
                    </button>
                  )}

                  {profile.is_looking && !roommate && (
                    <Badge variant="orange">Buscando</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-orange-400 mt-1 flex-wrap">
                  {profile.age && (
                    <span>
                      <Calendar size={13} className="inline" /> {profile.age} años
                    </span>
                  )}
                  {profile.profession && (
                    <span>
                      <Briefcase size={13} className="inline" /> {profile.profession}
                    </span>
                  )}
                  {profile.city && (
                    <span>
                      <MapPin size={13} className="inline" /> {profile.city}
                    </span>
                  )}
                </div>

                {roommate && (
                  <div className="mt-2 text-sm text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg inline-block">
                    🏠{' '}
                    {isMe
                      ? `Soy roomie de ${roommate.name}`
                      : `Es roomie de ${roommate.name}`}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isMe ? (
                  <Link
                    to="/profile/edit"
                    className="btn-primary flex items-center gap-1.5 text-sm py-2"
                  >
                    <Edit2 size={14} /> Editar perfil
                  </Link>
                ) : (
                  <>
                    {!roommate && !pendingRequest && (
                      <button
                        onClick={handleSendRequest}
                        disabled={requestSent}
                        className="btn-primary flex items-center gap-1.5 text-sm py-2 disabled:opacity-60"
                      >
                        <UserPlus size={14} />
                        {requestSent ? 'Solicitud enviada' : 'Solicitar roomie'}
                      </button>
                    )}
                    <button
                      onClick={handleOpenChat}
                      className="btn-secondary flex items-center gap-1.5 text-sm py-2"
                    >
                      <MessageCircle size={14} /> Chat
                    </button>
                    <button
                      onClick={() => setReportModal(true)}
                      className="p-2 text-orange-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                      title="Reportar usuario"
                    >
                      <Flag size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Solicitud pendiente → aceptar / rechazar */}
            {!isMe && pendingRequest && !roommate && (
              <div className="flex gap-2 mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="flex-1">
                  <p className="text-sm font-bold text-orange-800 mb-2">
                    ¡Te ha enviado una solicitud de roomie!
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondRequest(pendingRequest.id, 'accept')}
                      className="btn-primary text-xs py-2 px-4"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => respondRequest(pendingRequest.id, 'reject')}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Preferencias y Reseñas ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="card">
          <h2 className="font-display font-bold text-lg mb-4">
            Preferencias de convivencia
          </h2>
          <div className="space-y-3 text-sm">
            {(profile.budget_min || profile.budget_max) && (
              <div className="flex justify-between">
                <span className="text-orange-400">Presupuesto</span>
                <span className="font-semibold">
                  ₲{' '}
                  {profile.budget_min
                    ? (profile.budget_min / 1_000_000).toFixed(1) + 'M'
                    : '?'}
                  {' – '}
                  {profile.budget_max
                    ? (profile.budget_max / 1_000_000).toFixed(1) + 'M'
                    : '?'}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-orange-400">Mascotas</span>
              <span
                className={
                  profile.pets ? 'text-emerald-600 font-semibold' : 'text-gray-500'
                }
              >
                {profile.pets ? '✓ Tiene mascotas' : '✗ Sin mascotas'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-400">Fumador</span>
              <span
                className={
                  profile.smoker ? 'text-blue-500 font-semibold' : 'text-gray-500'
                }
              >
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

        <div className="card">
          <h2 className="font-display font-bold text-lg mb-4">
            Reseñas ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-orange-300 text-sm">Sin reseñas aún</p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="border-b border-orange-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{r.reviewer_name}</span>
                    <StarRating value={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="text-xs text-gray-500">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de reporte ──────────────────────────────────────────────── */}
      {reportModal && (
        <Modal onClose={() => setReportModal(false)} title="Reportar usuario">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-1 uppercase tracking-wide">
                Motivo
              </label>
              <select
                className="input"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="fake_profile">Perfil falso</option>
                <option value="inappropriate">Contenido inapropiado</option>
                <option value="spam">Spam</option>
                <option value="harassment">Acoso</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-1 uppercase tracking-wide">
                Descripción (opcional)
              </label>
              <textarea
                className="input resize-none h-24"
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describí el problema..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setReportModal(false)}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button onClick={handleReport} className="btn-primary">
                Enviar reporte
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}