import { Link } from 'react-router-dom'
import { MapPin, Briefcase, PawPrint, CigaretteOff, Clock } from 'lucide-react'
import { Avatar, CompatibilityBar, Badge } from '../ui'

export default function ProfileCard({ profile, compatibility, matches = [], mismatches = [] }) {
  return (
    <Link to={`/profile/${profile.user_id}`}
      className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 group">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar
          src={profile.profile_photo_url}
          name={profile.name}
          size="lg"
          verified={profile.verified}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-lg truncate">{profile.name}</h3>
            {profile.verified && <Badge variant="green">✓ Verificado</Badge>}
          </div>
          <div className="flex items-center gap-3 text-sm text-orange-400 mt-0.5 flex-wrap">
            {profile.age && <span>{profile.age} años</span>}
            {profile.profession && (
              <span className="flex items-center gap-1"><Briefcase size={12} />{profile.profession}</span>
            )}
            {profile.city && (
              <span className="flex items-center gap-1"><MapPin size={12} />{profile.city}</span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {profile.pets && <Badge variant="orange"><PawPrint size={11} className="inline" /> Tiene mascotas</Badge>}
        {!profile.smoker && <Badge variant="gray"><CigaretteOff size={11} className="inline" /> No fuma</Badge>}
        {profile.schedule && (
          <Badge variant="gray"><Clock size={11} className="inline" /> {profile.schedule}</Badge>
        )}
        {profile.budget_min && profile.budget_max && (
          <Badge variant="dark">
            ₲ {(profile.budget_min / 1_000_000).toFixed(1)}M – {(profile.budget_max / 1_000_000).toFixed(1)}M
          </Badge>
        )}
      </div>

      {/* Compatibility */}
      {compatibility != null && (
        <div className="border-t border-orange-100 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Compatibilidad</span>
          </div>
          <CompatibilityBar score={compatibility} />
          {matches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {matches.map(m => (
                <span key={m} className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">✓ {m}</span>
              ))}
              {mismatches.map(m => (
                <span key={m} className="text-[11px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">✗ {m}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </Link>
  )
}
