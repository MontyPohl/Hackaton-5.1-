import { useState, useEffect } from 'react'
import { Users, FileWarning, BarChart3, ShieldX, ShieldCheck, Eye, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import api from '../services/api'
import { Badge, Spinner } from '../components/ui'
import { toast } from 'react-hot-toast'

const TABS = ['Estadísticas', 'Reportes', 'Usuarios', 'Verificaciones']

export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)

  // Estado para la selfie que se está viendo
  const [selfieModal, setSelfieModal] = useState(null)   // { url, userName }
  const [loadingSelfie, setLoadingSelfie] = useState(null) // id del vr que está cargando

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data))
    api.get('/admin/reports?status=open').then(({ data }) => setReports(data.reports))
    api.get('/admin/users').then(({ data }) => setUsers(data.users))
    api.get('/verification/pending').then(({ data }) => setVerifications(data.pending))
      .finally(() => setLoading(false))
  }, [])

  const handleReport = async (id, action, status = 'reviewed') => {
    try {
      await api.put(`/admin/reports/${id}`, { action, status })
      setReports(r => r.filter(rep => rep.id !== id))
      toast.success('Acción aplicada')
    } catch {
      toast.error('Error')
    }
  }

  const handleUserStatus = async (userId, status) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status })
      setUsers(us => us.map(u => u.id === userId ? { ...u, status } : u))
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error')
    }
  }

  // Ver selfie — pide URL firmada al backend
  const handleVerSelfie = async (vr) => {
    setLoadingSelfie(vr.id)
    try {
      const { data } = await api.get(`/verification/${vr.id}/selfie-url`)
      setSelfieModal({ url: data.signed_url, userName: vr.user_name || `Usuario #${vr.user_id}`, vr })
    } catch {
      toast.error('No se pudo obtener la selfie')
    } finally {
      setLoadingSelfie(null)
    }
  }

  // Aprobar o rechazar verificación
  const handleReview = async (vrId, action, reason = '') => {
    try {
      await api.put(`/verification/${vrId}/review`, { action, reason })
      setVerifications(v => v.filter(x => x.id !== vrId))
      setSelfieModal(null)
      toast.success(action === 'approve' ? '✅ Verificación aprobada' : '❌ Verificación rechazada')
    } catch {
      toast.error('Error al procesar')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const adminUser   = users.find(u => u.role === 'admin')
  const normalUsers = users.filter(u => u.role !== 'admin')
  const pendingCount = verifications.length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center">
          <ShieldX size={20} className="text-primary-400" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-3xl">Panel de Administración</h1>
          <p className="text-orange-400 text-sm">Gestión de JAIKO!</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-orange-100 pb-0">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all relative
              ${tab === i
                ? 'bg-blue-500 text-white border border-orange-400 border-[1px]'
                : 'text-orange-400 border border-transparent hover:text-primary-500'}`}
          >
            {t}
            {/* Badge de pendientes en tab Verificaciones */}
            {i === 3 && pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── USUARIOS ────────────────────────────────────────────────────────── */}
      {tab === 2 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-orange-500 font-semibold text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {adminUser && (
                <tr key={adminUser.id} className="border-t border-orange-50 bg-yellow-50">
                  <td className="px-4 py-3 font-mono text-xs text-orange-400">Admin</td>
                  <td className="px-4 py-3">{adminUser.email}</td>
                  <td className="px-4 py-3"><Badge variant="dark">{adminUser.role}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={adminUser.status === 'active' ? 'green' : 'red'}>{adminUser.status}</Badge></td>
                  <td className="px-4 py-3"></td>
                </tr>
              )}
              {normalUsers.map(u => (
                <tr key={u.id} className="border-t border-orange-50 hover:bg-orange-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-orange-400">#{u.id}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3"><Badge variant="gray">{u.role}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.status !== 'blocked' && (
                        <button onClick={() => handleUserStatus(u.id, 'blocked')}
                          className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded-lg font-semibold">
                          Bloquear
                        </button>
                      )}
                      {u.status !== 'active' && (
                        <button onClick={() => handleUserStatus(u.id, 'active')}
                          className="text-xs bg-emerald-100 text-emerald-600 hover:bg-emerald-200 px-2 py-1 rounded-lg font-semibold">
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── VERIFICACIONES ──────────────────────────────────────────────────── */}
      {tab === 3 && (
        <div className="space-y-4">
          {verifications.length === 0 ? (
            <div className="card text-center py-16">
              <ShieldCheck size={48} className="text-emerald-400 mx-auto mb-3" />
              <p className="font-display font-bold text-lg text-emerald-600">Sin verificaciones pendientes</p>
              <p className="text-gray-400 text-sm mt-1">Todas las solicitudes han sido revisadas.</p>
            </div>
          ) : (
            verifications.map(vr => (
              <div key={vr.id} className="card flex items-center gap-4">
                {/* Foto de perfil */}
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-orange-100 bg-gray-100 flex-shrink-0">
                  {vr.profile_photo_url ? (
                    <img src={vr.profile_photo_url} alt={vr.user_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl font-bold">
                      {vr.user_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{vr.user_name || `Usuario #${vr.user_id}`}</p>
                  <p className="text-xs text-gray-400">Código: <span className="font-mono text-primary-500">{vr.verification_code}</span></p>
                  <p className="text-xs text-gray-400">
                    Selfie: {vr.selfie_url
                      ? <span className="text-emerald-500 font-semibold">Subida ✓</span>
                      : <span className="text-red-400">No subida aún</span>
                    }
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  {/* Ver selfie */}
                  {vr.selfie_url && (
                    <button
                      onClick={() => handleVerSelfie(vr)}
                      disabled={loadingSelfie === vr.id}
                      className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg font-semibold"
                    >
                      {loadingSelfie === vr.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Eye size={13} />
                      }
                      Ver selfie
                    </button>
                  )}

                  {/* Aprobar directo */}
                  <button
                    onClick={() => handleReview(vr.id, 'approve')}
                    className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg font-semibold"
                  >
                    <CheckCircle2 size={13} />
                    Aprobar
                  </button>

                  {/* Rechazar directo */}
                  <button
                    onClick={() => handleReview(vr.id, 'reject', 'No cumple los requisitos')}
                    className="flex items-center gap-1.5 text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded-lg font-semibold"
                  >
                    <XCircle size={13} />
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── MODAL SELFIE ────────────────────────────────────────────────────── */}
      {selfieModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelfieModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">Selfie de verificación</h2>
              <button onClick={() => setSelfieModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <p className="text-sm text-gray-500">
              Usuario: <span className="font-semibold text-gray-700">{selfieModal.userName}</span>
            </p>
            <p className="text-xs text-gray-400">
              Código esperado: <span className="font-mono text-primary-500">{selfieModal.vr.verification_code}</span>
            </p>

            {/* Imagen de la selfie */}
            <div className="rounded-xl overflow-hidden border-2 border-orange-100 bg-gray-50">
              <img
                src={selfieModal.url}
                alt="Selfie de verificación"
                className="w-full object-contain max-h-80"
                onError={() => toast.error('No se pudo cargar la imagen')}
              />
            </div>

            <p className="text-xs text-gray-400 text-center">
              ⏱ Esta imagen expira en 1 hora por seguridad
            </p>

            {/* Botones de acción desde el modal */}
            <div className="flex gap-3">
              <button
                onClick={() => handleReview(selfieModal.vr.id, 'approve')}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm"
              >
                <CheckCircle2 size={16} />
                Aprobar
              </button>
              <button
                onClick={() => handleReview(selfieModal.vr.id, 'reject', 'No cumple los requisitos')}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm"
              >
                <XCircle size={16} />
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}