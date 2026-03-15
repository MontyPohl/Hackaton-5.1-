import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, BedDouble, Bath, Users, PawPrint, Sofa, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'
import { Badge, Avatar, StarRating, Spinner } from '../components/ui'
import useAuthStore from '../context/authStore'
import { toast } from 'react-hot-toast'

export default function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [photo, setPhoto] = useState(0)
  const [MapComp, setMapComp] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/listings/${id}`),
      api.get(`/reviews/listing/${id}`),
    ]).then(([ld, rv]) => {
      setListing(ld.data.listing)
      setReviews(rv.data.reviews)
    }).catch(() => navigate('/listings'))
      .finally(() => setLoading(false))

    import('../components/map/JaikoMap').then(m => setMapComp(() => m.default))
  }, [id])

  const handleContact = async () => {
    if (!isAuthenticated()) { navigate('/login'); return }
    try {
      const { data } = await api.post(`/chats/private/${listing.owner_id}`)
      navigate(`/chat/${data.chat.id}`)
    } catch { toast.error('Error al abrir chat') }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!listing) return null

  const photos = listing.photos || []
  const isOwner = user?.id === listing.owner_id

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link to="/listings" className="flex items-center gap-1 text-orange-400 hover:text-primary-600 mb-4 text-sm font-semibold transition-colors">
        <ChevronLeft size={16} /> Volver a publicaciones
      </Link>

      {/* Photo gallery */}
      {photos.length > 0 ? (
        <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-6 bg-orange-100">
          <img src={photos[photo]?.photo_url} alt={listing.title} className="w-full h-full object-cover" />
          {photos.length > 1 && (
            <>
              <button onClick={() => setPhoto(p => (p - 1 + photos.length) % photos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setPhoto(p => (p + 1) % photos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors">
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhoto(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === photo ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="h-56 rounded-2xl bg-orange-100 flex items-center justify-center text-6xl mb-6">🏠</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="dark">{listing.type}</Badge>
                  <Badge variant={listing.status === 'active' ? 'green' : 'gray'}>{listing.status}</Badge>
                </div>
                <h1 className="font-display font-extrabold text-2xl">{listing.title}</h1>
                <div className="flex items-center gap-1 text-orange-400 text-sm mt-1">
                  <MapPin size={14} /> {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-extrabold text-3xl text-primary-600">
                  ₲ {(listing.total_price / 1_000_000).toFixed(1)}M
                </p>
                <p className="text-xs text-orange-400">por mes</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: BedDouble, label: `${listing.rooms} hab.` },
                { icon: Bath, label: `${listing.bathrooms} baños` },
                { icon: Users, label: `Máx. ${listing.max_people}` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-orange-50 rounded-xl p-3 flex flex-col items-center gap-1">
                  <Icon size={16} className="text-primary-500" />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
              ))}
              {listing.furnished && (
                <div className="bg-orange-50 rounded-xl p-3 flex flex-col items-center gap-1">
                  <Sofa size={16} className="text-purple-500" />
                  <span className="text-xs font-semibold">Amoblado</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {listing.pets_allowed && <Badge variant="orange"><PawPrint size={11} className="inline" /> Mascotas ok</Badge>}
              {listing.smoking_allowed && <Badge variant="gray">🚬 Fumadores ok</Badge>}
            </div>

            {listing.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
            )}
          </div>

          {/* Map */}
          {listing.latitude && listing.longitude && MapComp && (
            <div>
              <h2 className="font-display font-bold text-lg mb-3">Ubicación</h2>
              <MapComp
                center={[listing.latitude, listing.longitude]}
                markers={[{ lat: listing.latitude, lng: listing.longitude, title: listing.title }]}
                height="280px"
              />
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="card">
              <h2 className="font-display font-bold text-lg mb-4">
                Reseñas ({reviews.length}) · {(reviews.reduce((s,r) => s+r.rating, 0)/reviews.length).toFixed(1)} ⭐
              </h2>
              {reviews.map(r => (
                <div key={r.id} className="border-b border-orange-50 pb-3 mb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={r.reviewer_photo} name={r.reviewer_name} size="sm" />
                    <span className="font-semibold text-sm">{r.reviewer_name}</span>
                    <StarRating value={r.rating} />
                  </div>
                  {r.comment && <p className="text-xs text-gray-500 ml-10">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card sticky top-20">
            <h3 className="font-display font-bold text-base mb-4">Publicado por</h3>
            {listing.owner && (
              <Link to={`/profile/${listing.owner_id}`} className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
                <Avatar src={listing.owner.profile_photo_url} name={listing.owner.name} size="md" verified={listing.owner.verified} />
                <div>
                  <p className="font-semibold">{listing.owner.name}</p>
                  {listing.owner.profession && <p className="text-xs text-orange-400">{listing.owner.profession}</p>}
                </div>
              </Link>
            )}
            {!isOwner && (
              <button onClick={handleContact} className="btn-primary w-full flex items-center justify-center gap-2">
                <MessageCircle size={16} /> Contactar
              </button>
            )}
            {isOwner && (
              <Badge variant="orange" className="w-full text-center py-2">Tu publicación</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
