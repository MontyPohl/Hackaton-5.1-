import { useState, useEffect } from 'react'
import { ShieldCheck, Upload, Clock, CheckCircle2, XCircle } from 'lucide-react'
import api from '../services/api'
import { toast } from 'react-hot-toast'
import { Spinner } from '../components/ui'

const STATUS_CONFIG = {
  not_requested:       { icon: ShieldCheck,    color: 'text-orange-400', label: 'No solicitado' },
  pending_verification: { icon: Clock,          color: 'text-yellow-500', label: 'En revisión' },
  verified:            { icon: CheckCircle2,   color: 'text-emerald-500', label: 'Verificado' },
  rejected:            { icon: XCircle,        color: 'text-red-500',     label: 'Rechazado' },
}

export default function VerificationPage() {
  const [verification, setVerification] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [selfieUrl, setSelfieUrl]       = useState('')

  useEffect(() => {
    api.get('/verification/me').then(({ data }) => {
      setVerification(data.verification)
    }).finally(() => setLoading(false))
  }, [])

  const handleRequest = async () => {
    setSubmitting(true)
    try {
      const { data } = await api.post('/verification/request')
      setVerification(data.verification)
      toast.success('Solicitud creada. Descargá tu código.')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpload = async () => {
    if (!selfieUrl.trim()) { toast.error('Ingresá la URL de la selfie'); return }
    setSubmitting(true)
    try {
      const { data } = await api.post('/verification/upload-selfie', { selfie_url: selfieUrl })
      setVerification(data.verification)
      toast.success('Selfie enviada. Esperá la revisión.')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const status = verification?.status || 'not_requested'
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display font-extrabold text-3xl mb-2">Verificación de identidad</h1>
      <p className="text-orange-400 mb-8">
        El perfil verificado genera mayor confianza en la comunidad de JAIKO!
      </p>

      {/* Status */}
      <div className="card mb-6 flex items-center gap-4">
        <div className={`p-3 rounded-2xl bg-orange-50 ${cfg.color}`}>
          <Icon size={28} />
        </div>
        <div>
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Estado actual</p>
          <p className={`font-display font-bold text-xl ${cfg.color}`}>{cfg.label}</p>
        </div>
      </div>

      {/* Steps */}
      {status === 'not_requested' && (
        <div className="card space-y-5">
          <h2 className="font-display font-bold text-lg">¿Cómo funciona?</h2>
          {[
            { n: 1, t: 'Solicitá la verificación', d: 'Te generamos un código único tipo JAIKO-1234.' },
            { n: 2, t: 'Tomá una selfie con el código', d: 'Escribe el código en un papel y tomá una foto sosteniéndolo.' },
            { n: 3, t: 'Subí la foto', d: 'Pegá la URL de tu imagen (Supabase, Imgur, etc.).' },
            { n: 4, t: 'Revisión manual', d: 'Nuestro equipo verifier aprueba o rechaza en 24–48 hs.' },
          ].map(({ n, t, d }) => (
            <div key={n} className="flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-primary-500 text-white font-bold flex items-center justify-center flex-shrink-0">{n}</div>
              <div>
                <p className="font-semibold text-sm">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
            </div>
          ))}
          <button onClick={handleRequest} disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Solicitando...' : 'Solicitar verificación'}
          </button>
        </div>
      )}

      {status === 'pending_verification' && verification && (
        <div className="card space-y-5">
          {/* Code */}
          <div className="text-center py-4">
            <p className="text-sm text-orange-400 mb-2">Tu código de verificación</p>
            <div className="inline-block bg-brand-dark text-primary-400 font-mono font-bold text-3xl px-8 py-4 rounded-2xl tracking-widest">
              {verification.verification_code}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Escribí este código en un papel, tomá una selfie sosteniéndolo y subí la URL.
            </p>
          </div>

          {!verification.selfie_url && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-orange-400 uppercase tracking-wide">URL de tu selfie</label>
              <input className="input" placeholder="https://..." value={selfieUrl} onChange={e => setSelfieUrl(e.target.value)} />
              <button onClick={handleUpload} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                <Upload size={16} />
                {submitting ? 'Enviando...' : 'Enviar selfie'}
              </button>
            </div>
          )}

          {verification.selfie_url && (
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <Clock className="mx-auto text-yellow-500 mb-2" size={24} />
              <p className="font-semibold text-yellow-700 text-sm">Selfie recibida. Esperando revisión.</p>
              <p className="text-xs text-yellow-500 mt-1">En 24–48 hs te notificamos el resultado.</p>
            </div>
          )}
        </div>
      )}

      {status === 'verified' && (
        <div className="card text-center py-10">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
          <h2 className="font-display font-bold text-xl text-emerald-600">¡Estás verificado!</h2>
          <p className="text-gray-500 text-sm mt-2">Tu perfil muestra el sello de verificación de identidad.</p>
        </div>
      )}

      {status === 'rejected' && (
        <div className="card space-y-4">
          <div className="text-center py-6">
            <XCircle size={48} className="text-red-500 mx-auto mb-3" />
            <h2 className="font-display font-bold text-xl text-red-500">Verificación rechazada</h2>
            {verification?.rejection_reason && (
              <p className="text-sm text-gray-500 mt-2">{verification.rejection_reason}</p>
            )}
          </div>
          <button onClick={handleRequest} disabled={submitting} className="btn-primary w-full">
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  )
}
