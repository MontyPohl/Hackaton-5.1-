import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import api from '../services/api'
import ProfileCard from '../components/ui/ProfileCard'
import { Spinner, EmptyState } from '../components/ui'
import { toast } from 'react-hot-toast'

const SCHEDULES = ['morning', 'afternoon', 'night', 'flexible']
const CITIES = ['Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 'Lambaré', 'Capiatá', 'Encarnación', 'Ciudad del Este']

export default function SearchPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    city: 'Asunción',
    pets: '',
    smoker: '',
    schedule: '',
  })

  const fetchProfiles = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, per_page: 20, city: filters.city })
      const { data } = await api.get(`/profiles/search?${params}`)
      setProfiles(p === 1 ? data.profiles : (prev) => [...prev, ...data.profiles])
      setPage(p)
    } catch {
      toast.error('Error al buscar perfiles')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchProfiles(1) }, [filters.city])

  const handleSearch = (e) => { e.preventDefault(); fetchProfiles(1) }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl">Buscar roomies</h1>
          <p className="text-orange-400 text-sm mt-1">Perfiles con 80%+ de compatibilidad con vos</p>
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-2 btn-secondary py-2 px-4 text-sm"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {showFilters && <X size={14} />}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <form onSubmit={handleSearch} className="card mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-orange-400 mb-1 uppercase tracking-wide">Ciudad</label>
            <select
              className="input"
              value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-400 mb-1 uppercase tracking-wide">Mascotas</label>
            <select className="input" value={filters.pets}
              onChange={e => setFilters(f => ({ ...f, pets: e.target.value }))}>
              <option value="">Cualquiera</option>
              <option value="true">Con mascotas</option>
              <option value="false">Sin mascotas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-400 mb-1 uppercase tracking-wide">Fumador</label>
            <select className="input" value={filters.smoker}
              onChange={e => setFilters(f => ({ ...f, smoker: e.target.value }))}>
              <option value="">Cualquiera</option>
              <option value="false">No fuma</option>
              <option value="true">Fumador</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-400 mb-1 uppercase tracking-wide">Horario</label>
            <select className="input" value={filters.schedule}
              onChange={e => setFilters(f => ({ ...f, schedule: e.target.value }))}>
              <option value="">Cualquiera</option>
              {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="col-span-2 md:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary">Aplicar filtros</button>
          </div>
        </form>
      )}

      {/* Results */}
      {loading && profiles.length === 0 ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No encontramos roomies compatibles"
          description="Probá ajustar tus preferencias en tu perfil o cambiar el filtro de ciudad."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {profiles.map(p => (
              <ProfileCard
                key={p.user_id}
                profile={p}
                compatibility={p.compatibility}
                matches={p.matches}
                mismatches={p.mismatches}
              />
            ))}
          </div>

          {/* Load more */}
          <div className="flex justify-center mt-10">
            <button
              onClick={() => fetchProfiles(page + 1)}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              {loading ? <Spinner size="sm" /> : null}
              Cargar más
            </button>
          </div>
        </>
      )}
    </div>
  )
}
