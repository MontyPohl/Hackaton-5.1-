// ─── CreateListingPage ────────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { toast } from 'react-hot-toast'

export function CreateListingPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', city: 'Asunción', neighborhood: '',
    address: '', latitude: '', longitude: '', total_price: '',
    rooms: 1, bathrooms: 1, max_people: 2,
    pets_allowed: false, smoking_allowed: false, furnished: false,
    type: 'apartment',
  })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const tog = k => () => setForm(f => ({ ...f, [k]: !f[k] }))
  const Label = ({ children }) => <label className="block text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">{children}</label>

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title || !form.total_price) { toast.error('Título y precio son obligatorios'); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        total_price: parseInt(form.total_price),
        rooms: parseInt(form.rooms),
        bathrooms: parseInt(form.bathrooms),
        max_people: parseInt(form.max_people),
        latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      }
      const { data } = await api.post('/listings/', payload)
      toast.success('Publicación creada')
      navigate(`/listings/${data.listing.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al publicar')
    } finally {
      setLoading(false)
    }
  }

  const CITIES = ['Asunción','San Lorenzo','Luque','Fernando de la Mora','Lambaré','Capiatá','Encarnación','Ciudad del Este']

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display font-extrabold text-3xl mb-8">Publicar vivienda</h1>
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Label>Título *</Label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="Ej: Dpto 2 hab. en Asunción" required />
          </div>
          <div>
            <Label>Tipo</Label>
            <select className="input" value={form.type} onChange={set('type')}>
              <option value="apartment">Departamento</option>
              <option value="room">Habitación</option>
              <option value="house">Casa</option>
            </select>
          </div>
          <div>
            <Label>Ciudad *</Label>
            <select className="input" value={form.city} onChange={set('city')}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Barrio</Label>
            <input className="input" value={form.neighborhood} onChange={set('neighborhood')} placeholder="Ej: Villa Morra" />
          </div>
          <div>
            <Label>Precio mensual (₲) *</Label>
            <input className="input" type="number" value={form.total_price} onChange={set('total_price')} placeholder="Ej: 2500000" required />
          </div>
          <div>
            <Label>Habitaciones</Label>
            <input className="input" type="number" min={1} value={form.rooms} onChange={set('rooms')} />
          </div>
          <div>
            <Label>Baños</Label>
            <input className="input" type="number" min={1} value={form.bathrooms} onChange={set('bathrooms')} />
          </div>
          <div>
            <Label>Máx. personas</Label>
            <input className="input" type="number" min={1} value={form.max_people} onChange={set('max_people')} />
          </div>
          <div>
            <Label>Latitud (opcional)</Label>
            <input className="input" type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="-25.2867" />
          </div>
          <div>
            <Label>Longitud (opcional)</Label>
            <input className="input" type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="-57.647" />
          </div>
          <div className="md:col-span-2">
            <Label>Descripción</Label>
            <textarea className="input h-28 resize-none" value={form.description} onChange={set('description')} placeholder="Describí el espacio, comodidades, reglas..." />
          </div>
        </div>
        <div>
          <Label>Características</Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {[['pets_allowed','🐾 Mascotas permitidas'],['smoking_allowed','🚬 Fumadores ok'],['furnished','🛋️ Amoblado']].map(([k,l]) => (
              <button key={k} type="button" onClick={tog(k)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${form[k] ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-orange-200 text-orange-400 hover:border-orange-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-orange-100">
          <button type="button" onClick={() => navigate('/listings')} className="btn-ghost">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Publicando...' : 'Publicar'}</button>
        </div>
      </form>
    </div>
  )
}

export default CreateListingPage
