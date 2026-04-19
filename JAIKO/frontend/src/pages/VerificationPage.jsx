import React, { useState, useEffect, useRef } from 'react';
// ── CAMBIO 1: Agregamos FileText al import (ícono para los documentos) ────────
import { ShieldCheck, Upload, Clock, CheckCircle2, XCircle, Camera, Loader2, Info, FileText } from 'lucide-react';
import api from '../services/api';
import { uploadVerificationSelfie } from '../services/storage';
import { toast } from 'react-hot-toast';
import { Spinner } from '../components/ui';
import { motion } from 'motion/react';

const STATUS_CONFIG = {
  not_requested:        { icon: ShieldCheck,  color: 'text-slate-400',  bg: 'bg-slate-50', border: 'border-slate-100', label: 'No solicitado' },
  pending_verification: { icon: Clock,         color: 'text-amber-500',  bg: 'bg-amber-50', border: 'border-amber-100', label: 'En revisión' },
  verified:             { icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Verificado' },
  rejected:             { icon: XCircle,       color: 'text-red-500',     bg: 'bg-red-50', border: 'border-red-100', label: 'Rechazado' },
};

// ── CAMBIO 2: Nuevo componente reutilizable para subir documentos ─────────────
//
// ¿Por qué lo creamos como un componente separado y no dentro de VerificationPage?
// Porque tanto la Cédula como los Antecedentes tienen exactamente la misma
// estructura (input de archivo, botón de subir, badge de estado). Si copiáramos
// el código dos veces, cualquier cambio futuro habría que hacerlo en dos lugares.
// Un componente reutilizable resuelve eso — principio DRY (Don't Repeat Yourself).
//
// Props que recibe:
//   title        → Nombre que se muestra (ej: "Cédula de Identidad")
//   description  → Texto de ayuda debajo del título
//   documentType → Identificador para el backend (ej: "cedula" o "antecedentes")
//
function DocumentUploadCard({ title, description, documentType }) {
  // Estado del proceso de este documento particular:
  //   'idle'      → No se subió nada todavía
  //   'uploading' → Se está enviando al servidor en este momento
  //   'pending'   → Subido con éxito, esperando revisión del equipo
  //   'verified'  → El equipo confirmó que el documento es válido
  const [status, setStatus]     = useState('idle')
  const [file, setFile]         = useState(null)      // El archivo seleccionado
  const [fileName, setFileName] = useState('')        // Nombre del archivo (para mostrarlo)
  const fileRef                 = useRef(null)        // Referencia al input file oculto

  const handleFileSelect = (e) => {
    const selected = e.target.files[0]
    if (!selected) return

    // Validamos tamaño máximo de 10MB
    // 10 * 1024 * 1024 = 10 MB en bytes
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10MB')
      return
    }
    setFile(selected)
    setFileName(selected.name)
  }

  const handleUpload = async () => {
    if (!file) { toast.error('Seleccioná un archivo primero'); return }

    setStatus('uploading')
    try {
      // FormData es la forma estándar de enviar archivos por HTTP.
      // Funciona igual que un formulario HTML con enctype="multipart/form-data"
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', documentType) // 'cedula' o 'antecedentes'

      // Llamamos al endpoint del backend.
      // ⚠️ NOTA: este endpoint /verification/document todavía hay que crearlo
      // en verification_routes.py con el mismo patrón que uploadVerificationSelfie
      await api.post('/verification/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Si llegamos aquí es porque el servidor respondió OK (status 2xx)
      setStatus('pending')
      setFile(null)
      toast.success(`${title} enviada. El equipo la revisará pronto.`)
    } catch (err) {
      // Volvemos a 'idle' para que el usuario pueda reintentar
      setStatus('idle')
      toast.error(err.response?.data?.error || 'Error al subir el documento')
    }
  }

  // Configuración visual para cada estado posible
  // Cada estado tiene su propio color, fondo, texto e ícono
  const statusConfig = {
    idle:      { color: 'text-slate-400',   bg: 'bg-slate-50',   label: 'Sin subir',             icon: FileText     },
    uploading: { color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Subiendo...',            icon: Loader2      },
    pending:   { color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Pendiente de revisión', icon: Clock        },
    verified:  { color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Verificado',             icon: CheckCircle2 },
  }

  const cfg      = statusConfig[status]
  const StatusIcon = cfg.icon

  return (
    <div className="card p-6 border border-slate-100">

      {/* Cabecera: título a la izquierda, badge de estado a la derecha */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>

        {/* Badge que cambia según el estado actual */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} flex-shrink-0 ml-3`}>
          <StatusIcon
            size={12}
            // Cuando está subiendo, el ícono gira (efecto spinner)
            className={status === 'uploading' ? 'animate-spin' : ''}
          />
          {cfg.label}
        </div>
      </div>

      {/* Zona de upload: solo se muestra cuando el estado es 'idle' */}
      {/* Cuando ya se subió (pending/verified), no tiene sentido mostrarlo */}
      {status === 'idle' && (
        <div className="space-y-3">

          {/* Zona clickeable estilo "drag & drop" */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-orange-300 hover:bg-orange-50 transition-all group"
          >
            <Upload className="w-8 h-8 text-slate-300 group-hover:text-orange-400 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-slate-500 group-hover:text-orange-500">
              {/* Si ya eligieron un archivo, mostramos su nombre */}
              {fileName || 'Hacé clic para seleccionar el archivo'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG o PNG · máximo 10MB</p>
          </button>

          {/* Input de archivo real — está oculto porque el botón de arriba lo activa */}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/jpeg,image/png"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Botón "Enviar" — aparece solo después de seleccionar un archivo */}
          {file && (
            <button
              onClick={handleUpload}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Enviar {title}
            </button>
          )}
        </div>
      )}

      {/* Mensaje cuando el documento está en revisión */}
      {status === 'pending' && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 mt-2">
          <Clock size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            Documento recibido. Nuestro equipo lo revisará en las próximas 24-48 horas.
          </p>
        </div>
      )}

      {/* Mensaje cuando el documento fue verificado exitosamente */}
      {status === 'verified' && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mt-2">
          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            Documento verificado correctamente.
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal — sin cambios en su lógica interna
// ─────────────────────────────────────────────────────────────────────────────
export default function VerificationPage() {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/verification/me').then(({ data }) => {
      setVerification(data.verification);
    }).finally(() => setLoading(false));
  }, []);

  const handleRequest = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/verification/request');
      setVerification(data.verification);
      toast.success('Solicitud creada. ¡Ya podés subir tu selfie!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelfieSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('La imagen no puede superar 10MB'); return; }
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const handleUploadSelfie = async () => {
    if (!selfieFile) { toast.error('Seleccioná una foto primero'); return; }
    setSubmitting(true);
    try {
      await uploadVerificationSelfie(selfieFile);
      const { data } = await api.get('/verification/me');
      setVerification(data.verification);
      setSelfieFile(null);
      setSelfiePreview(null);
      toast.success('Selfie enviada. Esperá la revisión del equipo.');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al subir la selfie');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  const status = verification?.status || 'not_requested';
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-12">
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-slate-900 mb-4">Verificación de identidad</h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Un perfil verificado genera confianza y aumenta tus posibilidades de encontrar el roomie ideal.
        </p>
      </div>

      {/* Badge global del estado de la cuenta — sin cambios */}
      <div className={`card mb-12 flex flex-col sm:flex-row items-center gap-8 p-10 ${cfg.bg} ${cfg.border}`}>
        <div className={`w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-xl ${cfg.color}`}>
          <Icon size={40} />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estado de tu cuenta</p>
          <h2 className={`text-3xl font-display font-extrabold ${cfg.color}`}>{cfg.label}</h2>
        </div>
      </div>

      {/* ── CAMBIO 3: Sección de documentos — siempre visible ─────────────────
          Se muestra independientemente del estado de la verificación principal.
          Usamos el componente DocumentUploadCard para cada tipo de documento.
          La prop documentType es lo que distingue a uno del otro internamente. */}
      <div className="mb-12">
        <h2 className="font-display font-extrabold text-2xl text-slate-900 mb-2">
          Documentos requeridos
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Subí los documentos a continuación. El equipo los revisará de forma manual y actualizará el estado de cada uno.
        </p>

        {/* Grid de 2 columnas en pantallas medianas, 1 columna en móvil */}
        <div className="grid md:grid-cols-2 gap-6">
          <DocumentUploadCard
            title="Cédula de Identidad"
            description="Foto clara del frente y dorso de tu cédula."
            documentType="cedula"
          />
          <DocumentUploadCard
            title="Antecedentes Penales"
            description="Certificado oficial de antecedentes penales."
            documentType="antecedentes"
          />
        </div>
      </div>

      {/* Las secciones de abajo son las originales — sin ningún cambio */}

      {status === 'not_requested' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-10">
            <h2 className="font-display font-extrabold text-2xl mb-8">¿Cómo funciona?</h2>
            <div className="space-y-8">
              {[
                { n: '01', t: 'Solicitá el código', d: 'Te asignaremos un código único para tu verificación.' },
                { n: '02', t: 'Tomá una selfie', d: 'Sostené un papel con el código escrito claramente.' },
                { n: '03', t: 'Subí la foto', d: 'Nuestro equipo revisará tu identidad manualmente.' },
              ].map((step) => (
                <div key={step.n} className="flex gap-6">
                  <div className="text-3xl font-display font-black text-slate-100">{step.n}</div>
                  <div>
                    <p className="font-bold text-slate-900 mb-1">{step.t}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleRequest} disabled={submitting} className="w-full btn-primary mt-10">
              {submitting ? 'Solicitando...' : 'EMPEZAR VERIFICACIÓN'}
            </button>
          </div>
          <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
            <ShieldCheck className="w-16 h-16 mb-8 opacity-50" />
            <h3 className="text-2xl font-display font-extrabold mb-4">¿Por qué verificar?</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm font-medium">
                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                Aparecé primero en los resultados de búsqueda.
              </li>
              <li className="flex items-start gap-3 text-sm font-medium">
                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                Insignia de confianza en tu perfil público.
              </li>
              <li className="flex items-start gap-3 text-sm font-medium">
                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                Acceso a grupos exclusivos de roomies verificados.
              </li>
            </ul>
          </div>
        </div>
      )}

      {status === 'pending_verification' && verification && (
        <div className="card p-10 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tu código único</p>
              <div className="bg-slate-900 text-orange-500 font-mono font-bold text-4xl py-6 rounded-3xl tracking-[0.5em] shadow-2xl">
                {verification.verification_code}
              </div>
            </div>

            {!verification.selfie_url ? (
              <div className="space-y-8">
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4 text-left">
                  <Info className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                  <p className="text-sm text-blue-700 font-medium">
                    Escribí el código en un papel, sacate una selfie sosteniéndolo y subila aquí. Asegurate de que tu cara y el código sean legibles.
                  </p>
                </div>

                {selfiePreview && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl"
                  >
                    <img src={selfiePreview} alt="Preview" className="w-full h-64 object-cover" />
                    <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-lg">
                      <XCircle size={20} />
                    </button>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                    <Camera size={20} /> {selfieFile ? 'Cambiar foto' : 'Tomar foto'}
                  </button>
                  {selfieFile && (
                    <button onClick={handleUploadSelfie} disabled={submitting} className="flex-1 btn-primary flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                      Enviar selfie
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieSelect} />
              </div>
            ) : (
              <div className="py-10">
                <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock size={40} />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-slate-900 mb-2">Revisión en curso</h3>
                <p className="text-slate-500">Recibimos tu selfie. Nuestro equipo la revisará en las próximas 24-48 horas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'verified' && (
        <div className="card p-20 text-center">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-4xl font-display font-extrabold text-slate-900 mb-4">¡Perfil Verificado!</h2>
          <p className="text-slate-500 text-lg max-w-sm mx-auto">Ya contás con el sello de confianza de JAIKO!. Tu perfil ahora es prioritario en las búsquedas.</p>
        </div>
      )}

      {status === 'rejected' && (
        <div className="card p-12 text-center border-red-100 bg-red-50/30">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} />
          </div>
          <h2 className="text-2xl font-display font-extrabold text-red-600 mb-2">Verificación Rechazada</h2>
          {verification?.rejection_reason && (
            <p className="text-slate-600 mb-8 p-4 bg-white rounded-2xl border border-red-100 italic">"{verification.rejection_reason}"</p>
          )}
          <button onClick={handleRequest} disabled={submitting} className="btn-primary bg-red-500 hover:bg-red-600">
            INTENTAR DE NUEVO
          </button>
        </div>
      )}
    </div>
  );
}
