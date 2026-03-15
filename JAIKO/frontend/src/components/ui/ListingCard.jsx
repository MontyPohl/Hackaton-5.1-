import { Link } from 'react-router-dom'
import { MapPin, BedDouble, Users, PawPrint, CigaretteOff, Sofa } from 'lucide-react'
import { Badge } from '../ui'

const TYPE_LABELS = { apartment: 'Departamento', room: 'Habitación', house: 'Casa' }

export default function ListingCard({ listing }) {
  const mainPhoto = listing.photos?.[0]?.photo_url

  return (
    <Link to={`/listings/${listing.id}`}
      className="card p-0 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* Photo */}
      <div className="relative h-48 bg-orange-100 overflow-hidden">
        {mainPhoto ? (
          <img src={mainPhoto} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-orange-200">🏠</div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="dark">{TYPE_LABELS[listing.type] || listing.type}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-bold text-base line-clamp-1">{listing.title}</h3>

        <div className="flex items-center gap-1 text-sm text-orange-400">
          <MapPin size={13} />
          <span className="truncate">{listing.neighborhood || listing.city}</span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-1 mt-auto pt-2">
          <span className="font-display font-extrabold text-xl text-primary-600">
            ₲ {(listing.total_price / 1_000_000).toFixed(1)}M
          </span>
          <span className="text-xs text-orange-400 mb-0.5">/mes</span>
        </div>

        {/* Details row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-orange-100 pt-2 flex-wrap">
          <span className="flex items-center gap-1"><BedDouble size={12} /> {listing.rooms} hab.</span>
          <span className="flex items-center gap-1"><Users size={12} /> máx. {listing.max_people}</span>
          {listing.pets_allowed && <span className="flex items-center gap-1 text-emerald-500"><PawPrint size={12} /> Mascotas</span>}
          {listing.smoking_allowed && <span className="flex items-center gap-1 text-blue-400">🚬 Fumadores</span>}
          {listing.furnished && <span className="flex items-center gap-1 text-purple-400"><Sofa size={12} /> Amoblado</span>}
        </div>
      </div>
    </Link>
  )
}
