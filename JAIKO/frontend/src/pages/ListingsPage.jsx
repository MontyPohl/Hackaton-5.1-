import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// ── CAMBIO 1: Importamos useLocation para leer el estado del router ───────────
// useLocation().state es donde ProfilePage guarda { flyTo, switchToMap }
import { useLocation } from 'react-router-dom';
import { Map, LayoutGrid, Plus, SlidersHorizontal, X } from 'lucide-react';
import api from '../services/api';
import ListingCard from '../components/ui/ListingCard';
import { Spinner, EmptyState } from '../components/ui';
import useAuthStore from '../context/authStore';

const CITIES = [
  'Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora',
  'Lambaré', 'Capiatá', 'Encarnación', 'Ciudad del Este',
];

// Coordenadas centrales de cada ciudad — para centrar el mapa
const CITY_CENTERS = {
  'Asunción': [-25.2867, -57.647],
  'San Lorenzo': [-25.3355, -57.5178],
  'Luque': [-25.2635, -57.4857],
  'Fernando de la Mora': [-25.3085, -57.5225],
  'Lambaré': [-25.3404, -57.6075],
  'Capiatá': [-25.356, -57.4455],
  'Encarnación': [-27.3333, -55.8667],
  'Ciudad del Este': [-25.5097, -54.611],
};

export default function ListingsPage() {
  const { isAuthenticated } = useAuthStore();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // ── CAMBIO 2: Leer el estado que nos pasó ProfilePage ────────────────────
  // useLocation() devuelve el objeto de la ruta actual.
  // .state es el objeto que pasamos en navigate('/listings', { state: {...} })
  //
  // Ejemplo de lo que puede llegar:
  //   { flyTo: [-25.28, -57.64], switchToMap: true }
  const routerState = useLocation().state;

  // ── CAMBIO 3: Estado para las coordenadas de foco en el mapa ─────────────
  // Si llegamos desde ProfilePage con flyTo, lo usamos como valor inicial.
  // null = el mapa muestra el centro de la ciudad sin foco especial.
  const [mapFlyTo, setMapFlyTo] = useState(
    routerState?.flyTo || null
  )

  // ── CAMBIO 4: Estado para el componente JaikoMap (carga lazy) ─────────────
  // Igual que en ListingDetailPage: cargamos JaikoMap solo cuando se necesita
  // para no agregar su peso al bundle inicial de la página.
  const [MapComp, setMapComp] = useState(null)

  const [filters, setFilters] = useState({
    city:             'Asunción',
    min_price:        '',
    max_price:        '',
    pets_allowed:     '',
    smoking_allowed:  '',
    type:             '',
    // Nuevos filtros: género preferido del roomie y edad mínima
    preferred_gender: '',   // 'male' | 'female' | 'non_binary' | '' (cualquiera)
    min_age:          '',   // número >= 18, '' = sin límite
  });

  // ── CAMBIO 5: Efecto que responde a la navegación desde ProfilePage ────────
  // Si llegamos con { switchToMap: true } en el estado del router,
  // automáticamente activamos la vista de mapa.
  // Solo corre una vez al montar el componente (dependencias vacías []).
  useEffect(() => {
    if (routerState?.switchToMap) {
      setView('map')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CAMBIO 6: Cargar JaikoMap de forma lazy cuando se activa la vista mapa ─
  // No queremos cargar Leaflet si el usuario está en vista grid.
  // useEffect con [view] se ejecuta cada vez que view cambia.
  useEffect(() => {
    if (view === 'map' && !MapComp) {
      // import() dinámico: carga el módulo solo cuando se necesita
      import('../components/map/JaikoMap').then(m => {
        setMapComp(() => m.default)
      })
    }
  }, [view])

  // Carga los listings cuando cambian los filtros
  useEffect(() => {
    const params = new URLSearchParams({ page: 1, per_page: 24, city: filters.city });
    if (filters.min_price)       params.set('min_price',        filters.min_price);
    if (filters.max_price)       params.set('max_price',        filters.max_price);
    if (filters.pets_allowed)    params.set('pets_allowed',     filters.pets_allowed);
    if (filters.smoking_allowed) params.set('smoking_allowed',  filters.smoking_allowed);
    if (filters.type)            params.set('type',             filters.type);
    if (filters.preferred_gender) params.set('preferred_gender', filters.preferred_gender);
    if (filters.min_age)         params.set('min_age',          filters.min_age);

    setLoading(true);
    api.get(`/listings/?${params}`)
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const activeFilterCount = [
    filters.min_price, filters.max_price, filters.pets_allowed,
    filters.smoking_allowed, filters.type, filters.preferred_gender, filters.min_age,
  ].filter(Boolean).length;

  // ── CAMBIO 7: Preparar los marcadores para JaikoMap ──────────────────────
  // JaikoMap espera: [{ lat, lng, id, title, price, neighborhood }]
  // Los listings tienen latitude/longitude (nombres distintos), hay que mapear.
  // .filter() descarta listings sin coordenadas (no pueden mostrarse en el mapa).
  const listingMarkers = listings
    .filter(l => l.latitude && l.longitude)
    .map(l => ({
      lat:          l.latitude,
      lng:          l.longitude,
      id:           l.id,
      title:        l.title,
      price:        l.total_price,
      neighborhood: l.neighborhood,
    }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">Departamentos</h1>
          <p className="text-orange-500 font-medium mt-1">{listings.length} publicaciones disponibles</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Botones Grid / Mapa */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setView('grid')}
              className={`px-4 py-2 flex items-center gap-2 text-sm font-bold rounded-xl transition-all
                ${view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={16} /> Grid
            </button>
            <button
              onClick={() => {
                setView('map')
                // Al cambiar a mapa manualmente (no desde perfil), limpiamos el flyTo
                // para que no quede un foco residual de una navegación anterior
                if (!routerState?.flyTo) setMapFlyTo(null)
              }}
              className={`px-4 py-2 flex items-center gap-2 text-sm font-bold rounded-xl transition-all
                ${view === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Map size={16} /> Mapa
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all relative"
          >
            <SlidersHorizontal size={16} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </button>

          {isAuthenticated() && (
            <Link to="/listings/new" className="btn-primary flex items-center gap-2 py-2.5">
              <Plus size={18} /> Publicar
            </Link>
          )}
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className={`card mb-10 overflow-hidden transition-all duration-500 ${showFilters ? 'max-h-[1000px] opacity-100 p-8' : 'max-h-0 opacity-0 p-0 border-none shadow-none'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
            <select
              className="input"
              value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
            <select
              className="input"
              value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="apartment">Departamento</option>
              <option value="room">Habitación</option>
              <option value="house">Casa</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Precio mín</label>
            <input type="number" className="input" value={filters.min_price} placeholder="0"
              onChange={e => setFilters(f => ({ ...f, min_price: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Precio máx</label>
            <input type="number" className="input" value={filters.max_price} placeholder="Sin límite"
              onChange={e => setFilters(f => ({ ...f, max_price: e.target.value }))} />
          </div>

          {/* Género preferido del roomie */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Género del roomie
            </label>
            <select
              className="input"
              value={filters.preferred_gender}
              onChange={e => setFilters(f => ({ ...f, preferred_gender: e.target.value }))}
            >
              <option value="">Cualquiera</option>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="non_binary">No binario</option>
            </select>
          </div>

          {/* Edad mínima del roomie */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Edad mínima del roomie
            </label>
            <input
              type="number"
              className="input"
              min={18} max={80}
              value={filters.min_age}
              placeholder="Sin límite"
              onChange={e => setFilters(f => ({ ...f, min_age: e.target.value }))}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-3 pt-4 border-t border-slate-50">
            {[
              ['pets_allowed', '🐾 Mascotas'],
              ['smoking_allowed', '🚬 Fumadores']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilters(f => ({ ...f, [key]: f[key] === 'true' ? '' : 'true' }))}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all
                  ${filters[key] === 'true'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setFilters({
                city: 'Asunción', min_price: '', max_price: '',
                pets_allowed: '', smoking_allowed: '', type: '',
                preferred_gender: '', min_age: '',
              })}
              className="ml-auto text-sm font-bold text-red-400 hover:text-red-500 flex items-center gap-1"
            >
              <X size={14} /> Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* ── CAMBIO 8: Contenido con vista Mapa implementada ──────────────── */}
      {loading ? (
        <div className="flex justify-center py-32"><Spinner size="lg" /></div>

      ) : listings.length === 0 && view === 'grid' ? (
        <EmptyState icon="🏠" title="No hay publicaciones" description="Sé el primero en publicar en esta ciudad." />

      ) : view === 'map' ? (
        // ── VISTA MAPA ──────────────────────────────────────────────────────
        <div>
          {/* Contador de marcadores sobre el mapa */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-500">
              {listingMarkers.length === 0
                ? 'No hay departamentos con ubicación en esta ciudad'
                : `${listingMarkers.length} departamento${listingMarkers.length !== 1 ? 's' : ''} en el mapa`
              }
            </p>
            {/* Si llegamos desde el perfil con flyTo, mostramos de dónde vino el foco */}
            {mapFlyTo && (
              <button
                onClick={() => setMapFlyTo(null)}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <X size={12} /> Quitar foco de tu ubicación
              </button>
            )}
          </div>

          {MapComp ? (
            // JaikoMap ya está cargado → renderizamos el mapa
            <MapComp
              center={CITY_CENTERS[filters.city] || [-25.2867, -57.647]}
              listingMarkers={listingMarkers}
              height="600px"
              flyTo={mapFlyTo}
            />
          ) : (
            // JaikoMap todavía se está cargando (import() dinámico)
            <div className="flex justify-center items-center py-32 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Spinner size="lg" />
                <p className="text-sm font-medium">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>

      ) : (
        // ── VISTA GRID (original, sin cambios) ────────────────────────────
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
