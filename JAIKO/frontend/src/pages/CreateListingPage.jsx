import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, X, Loader2, AlertCircle, MapPin } from 'lucide-react'
import api from '../services/api'
import { uploadListingPhoto } from '../services/storage'
import { toast } from 'react-hot-toast'
// Mismos imports de mapa que EditProfilePage
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix de íconos rotos por Vite (igual que EditProfilePage)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CITIES = ['Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 'Lambaré', 'Capiatá', 'Encarnación', 'Ciudad del Este']

// Coordenadas centrales de cada ciudad
const CITY_COORDS = {
  'Asunción':            [-25.28646, -57.64700],
  'San Lorenzo':         [-25.33550, -57.51775],
  'Luque':               [-25.26348, -57.48570],
  'Fernando de la Mora': [-25.30848, -57.52245],
  'Lambaré':             [-25.34037, -57.60753],
  'Capiatá':             [-25.35602, -57.44545],
  'Encarnación':         [-27.33333, -55.86667],
  'Ciudad del Este':     [-25.50966, -54.61105],
}

const MIN_PHOTOS = 4
const MAX_PHOTOS = 8

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">
    {children}
  </label>
)

export function CreateListingPage() {
  const navigate = useNavigate()

  const defaultLat = CITY_COORDS['Asunción'][0]
  const defaultLng = CITY_COORDS['Asunción'][1]

  const [form, setForm] = useState({
    title: '', description: '', city: 'Asunción', neighborhood: '',
    address: '', latitude: defaultLat, longitude: defaultLng,
    total_price: '', rooms: 1, bathrooms: 1, max_people: 2,
    pets_allowed: false, smoking_allowed: false, furnished: false,
    type: 'apartment',
    // Preferencias del roomie
    preferred_gender:  'any',  // 'any' | 'male' | 'female' | 'non_binary'
    min_age_required:  18,     // edad mínima del roomie (número)
  })

  const [photoFiles, setPhotoFiles]           = useState([])
  const [loading, setLoading]                 = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  // locationSelected: false hasta que el usuario haga clic o arrastre el pin.
  // Así distinguimos "el pin está en el centro de la ciudad por defecto"
  // de "el usuario confirmó exactamente dónde está el departamento".
  const [locationSelected, setLocationSelected] = useState(false)

  // Errores visuales por sección
  const [errors, setErrors] = useState({
    title: null, price: null, photos: null, location: null,
  })

  const setField = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const tog      = k => () => setForm(f => ({ ...f, [k]: !f[k] }))

  // Cuando cambia la ciudad, el mapa vuela a esa ciudad.
  // Si el usuario NO marcó ubicación todavía, también movemos el pin.
  const handleCityChange = (e) => {
    const newCity = e.target.value
    const [newLat, newLng] = CITY_COORDS[newCity] || [defaultLat, defaultLng]
    setForm(f => ({
      ...f,
      city:      newCity,
      latitude:  locationSelected ? f.latitude  : newLat,
      longitude: locationSelected ? f.longitude : newLng,
    }))
  }

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files)
    const remaining = MAX_PHOTOS - photoFiles.length
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotoFiles(prev => [...prev, ...toAdd])
    e.target.value = ''
    if (errors.photos) setErrors(p => ({ ...p, photos: null }))
  }

  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Sub-componente del marcador interactivo (igual patrón que EditProfilePage)
  // Definido dentro del componente para acceder al estado sin props
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setForm(f => ({ ...f, latitude: e.latlng.lat, longitude: e.latlng.lng }))
        setLocationSelected(true)
        setErrors(p => ({ ...p, location: null }))
      },
    })
    return (
      <Marker
        position={[form.latitude, form.longitude]}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const pos = e.target.getLatLng()
            setForm(f => ({ ...f, latitude: pos.lat, longitude: pos.lng }))
            setLocationSelected(true)
            setErrors(p => ({ ...p, location: null }))
          }
        }}
      />
    )
  }

  // Sub-componente que mueve la cámara del mapa cuando cambia lat/lng
  function FlyToCity({ lat, lng }) {
    const map = useMap()
    useEffect(() => {
      if (lat && lng) map.flyTo([lat, lng], 14, { duration: 0.8 })
    }, [lat, lng])
    return null
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const newErrors = { title: null, price: null, photos: null, location: null }
    let hasErrors = false

    if (!form.title.trim()) {
      newErrors.title = 'El título es obligatorio'
      hasErrors = true
    }
    if (!form.total_price || parseInt(form.total_price) <= 0) {
      newErrors.price = 'El precio mensual es obligatorio'
      hasErrors = true
    }
    if (photoFiles.length < MIN_PHOTOS) {
      newErrors.photos = `Necesitás al menos ${MIN_PHOTOS} fotos (tenés ${photoFiles.length})`
      hasErrors = true
    }
    if (!locationSelected) {
      newErrors.location = 'Hacé clic en el mapa para marcar la ubicación del departamento'
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      toast.error('Revisá los campos marcados antes de publicar', { duration: 4000 })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        total_price: parseInt(form.total_price),
        rooms:       parseInt(form.rooms),
        bathrooms:   parseInt(form.bathrooms),
        max_people:  parseInt(form.max_people),
        latitude:    form.latitude,
        longitude:   form.longitude,
      }
      const { data } = await api.post('/listings/', payload)
      const listingId = data.listing.id

      setUploadingPhotos(true)
      for (const { file } of photoFiles) {
        try { await uploadListingPhoto(listingId, file) }
        catch { toast.error(`No se pudo subir ${file.name}`) }
      }
      setUploadingPhotos(false)

      toast.success('¡Publicación creada!')
      navigate(`/listings/${listingId}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al publicar')
    } finally {
      setLoading(false)
      setUploadingPhotos(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl mb-6 sm:mb-8">
        Publicar vivienda
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-5 sm:space-y-6">

        {/* ── Info básica ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

          <div className="sm:col-span-2">
            <Label>Título *</Label>
            <input
              className={`input ${errors.title ? 'border-red-300 focus:border-red-400' : ''}`}
              value={form.title}
              onChange={e => { setField('title')(e); if (errors.title) setErrors(p => ({ ...p, title: null })) }}
              placeholder="Ej: Dpto 2 hab. en Asunción"
            />
            {errors.title && (
              <div className="flex items-center gap-1.5 mt-1.5 text-red-500">
                <AlertCircle size={13} /><p className="text-xs font-medium">{errors.title}</p>
              </div>
            )}
          </div>

          <div>
            <Label>Tipo</Label>
            <select className="input" value={form.type} onChange={setField('type')}>
              <option value="apartment">Departamento</option>
              <option value="room">Habitación</option>
              <option value="house">Casa</option>
            </select>
          </div>

          <div>
            <Label>Ciudad *</Label>
            <select className="input" value={form.city} onChange={handleCityChange}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <Label>Barrio</Label>
            <input className="input" value={form.neighborhood}
              onChange={setField('neighborhood')} placeholder="Ej: Villa Morra" />
          </div>

          <div>
            <Label>Precio mensual (₲) *</Label>
            <input
              className={`input ${errors.price ? 'border-red-300 focus:border-red-400' : ''}`}
              type="number" value={form.total_price}
              onChange={e => { setField('total_price')(e); if (errors.price) setErrors(p => ({ ...p, price: null })) }}
              placeholder="Ej: 2500000"
            />
            {errors.price && (
              <div className="flex items-center gap-1.5 mt-1.5 text-red-500">
                <AlertCircle size={13} /><p className="text-xs font-medium">{errors.price}</p>
              </div>
            )}
          </div>

          <div>
            <Label>Habitaciones</Label>
            <input className="input" type="number" min={1} value={form.rooms} onChange={setField('rooms')} />
          </div>
          <div>
            <Label>Baños</Label>
            <input className="input" type="number" min={1} value={form.bathrooms} onChange={setField('bathrooms')} />
          </div>
          <div>
            <Label>Máx. personas</Label>
            <input className="input" type="number" min={1} value={form.max_people} onChange={setField('max_people')} />
          </div>

          {/* ── Preferencias del roomie ───────────────────────────────────── */}
          {/* Separador visual para distinguir esta sección */}
          <div className="sm:col-span-2 pt-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              👥 Preferencias del roomie
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Género del roomie */}
              <div>
                <Label>Género preferido</Label>
                <select
                  className="input"
                  value={form.preferred_gender}
                  onChange={setField('preferred_gender')}
                >
                  <option value="any">Sin preferencia</option>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                  <option value="non_binary">No binario</option>
                </select>
              </div>

              {/* Edad mínima del roomie */}
              <div>
                <Label>Edad mínima del roomie</Label>
                <input
                  className="input"
                  type="number"
                  min={18}
                  max={80}
                  value={form.min_age_required}
                  onChange={setField('min_age_required')}
                  placeholder="18"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label>Descripción</Label>
            <textarea className="input h-24 sm:h-28 resize-none" value={form.description}
              onChange={setField('description')} placeholder="Describí el espacio, comodidades, reglas..." />
          </div>
        </div>

        {/* ── Mapa de ubicación ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-orange-400" />
            <Label>Ubicación en el mapa *</Label>
          </div>

          <p className={`text-xs mb-2 font-medium transition-colors ${
            errors.location ? 'text-red-500' : locationSelected ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            {locationSelected
              ? '✓ Ubicación marcada. Podés ajustarla moviendo el pin.'
              : 'Hacé clic en el mapa o arrastrá el pin para marcar la ubicación exacta.'
            }
          </p>

          <div className={`rounded-xl overflow-hidden border-2 transition-colors ${
            errors.location   ? 'border-red-300'
            : locationSelected ? 'border-emerald-300'
            :                    'border-orange-100'
          }`} style={{ height: '280px' }}>
            <MapContainer
              center={[form.latitude, form.longitude]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FlyToCity lat={form.latitude} lng={form.longitude} />
              <LocationMarker />
            </MapContainer>
          </div>

          {errors.location && (
            <div className="flex items-center gap-1.5 mt-2 text-red-500">
              <AlertCircle size={13} className="flex-shrink-0" />
              <p className="text-xs font-medium">{errors.location}</p>
            </div>
          )}

          {locationSelected && (
            <p className="text-xs text-slate-400 mt-1.5 font-mono">
              Lat: {form.latitude.toFixed(5)} · Lng: {form.longitude.toFixed(5)}
            </p>
          )}
        </div>

        {/* ── Fotos ──────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Fotos del lugar *</Label>
            <span className={`text-xs font-bold ${
              errors.photos           ? 'text-red-500'
              : photoFiles.length >= MIN_PHOTOS ? 'text-emerald-600'
              :                                   'text-slate-400'
            }`}>
              {photoFiles.length} / {MAX_PHOTOS}
              {photoFiles.length < MIN_PHOTOS ? ` (mínimo ${MIN_PHOTOS})` : ' ✓'}
            </span>
          </div>

          <div className={`rounded-xl p-2 border-2 transition-colors ${
            errors.photos             ? 'border-red-300 bg-red-50/30'
            : photoFiles.length >= MIN_PHOTOS ? 'border-emerald-200 bg-emerald-50/20'
            :                                   'border-transparent'
          }`}>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {photoFiles.map(({ preview }, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-orange-100">
                  <img src={preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600">
                    <X size={11} />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/40 text-white text-[9px] font-bold px-1 rounded">
                    {i + 1}
                  </span>
                </div>
              ))}

              {photoFiles.length < MAX_PHOTOS && (
                <label className={`aspect-square rounded-xl border-2 border-dashed
                  flex flex-col items-center justify-center cursor-pointer transition
                  ${errors.photos
                    ? 'border-red-300 hover:border-red-400 hover:bg-red-50'
                    : 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                  }`}>
                  <ImagePlus size={20} className={errors.photos ? 'text-red-300' : 'text-orange-300'} />
                  <span className={`text-xs mt-1 ${errors.photos ? 'text-red-400' : 'text-orange-300'}`}>
                    Agregar
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                    className="hidden" onChange={handlePhotoSelect} />
                </label>
              )}
            </div>
          </div>

          {errors.photos ? (
            <div className="flex items-center gap-1.5 mt-2 text-red-500">
              <AlertCircle size={13} className="flex-shrink-0" />
              <p className="text-xs font-medium">{errors.photos}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1.5">Las fotos se suben al publicar · máx. 5MB cada una</p>
          )}
        </div>

        {/* ── Características ────────────────────────────────────────────── */}
        <div>
          <Label>Características</Label>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
            {[
              ['pets_allowed',    '🐾 Mascotas permitidas'],
              ['smoking_allowed', '🚬 Fumadores ok'],
              ['furnished',       '🛋️ Amoblado'],
            ].map(([k, l]) => (
              <button key={k} type="button" onClick={tog(k)}
                className={`px-3 sm:px-4 py-2 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all
                  ${form[k]
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-orange-200 text-orange-400 hover:border-orange-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Resumen de errores (solo visible cuando hay errores) ────────── */}
        {(errors.title || errors.price || errors.photos || errors.location) && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-xs font-bold text-red-600 mb-2 uppercase tracking-wide">
              Completá lo siguiente antes de publicar:
            </p>
            <ul className="space-y-1">
              {errors.title    && <li className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={11} /> {errors.title}</li>}
              {errors.price    && <li className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={11} /> {errors.price}</li>}
              {errors.photos   && <li className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={11} /> {errors.photos}</li>}
              {errors.location && <li className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={11} /> {errors.location}</li>}
            </ul>
          </div>
        )}

        {/* ── Botones finales ────────────────────────────────────────────── */}
        <div className="flex gap-3 justify-end pt-2 border-t border-orange-100">
          <button type="button" onClick={() => navigate('/listings')} className="btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" />{uploadingPhotos ? 'Subiendo fotos...' : 'Publicando...'}</>
              : 'Publicar'
            }
          </button>
        </div>

      </form>
    </div>
  )
}

export default CreateListingPage
