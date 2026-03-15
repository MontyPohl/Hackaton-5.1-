import { Link } from 'react-router-dom'
import { Search, Building2, Users, ShieldCheck, ArrowRight } from 'lucide-react'
import useAuthStore from '../context/authStore'

const FEATURES = [
  {
    icon: Search,
    title: 'Encontrá tu roomie',
    desc: 'Algoritmo de compatibilidad al 80%+ basado en presupuesto, hábitos y horarios.',
    to: '/search',
    color: 'bg-orange-100 text-primary-600',
  },
  {
    icon: Building2,
    title: 'Publicaciones',
    desc: 'Encontrá departamentos y habitaciones disponibles en todo Paraguay.',
    to: '/listings',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Grupos',
    desc: 'Armá un grupo con roomies compatibles y buscen vivienda juntos.',
    to: '/groups',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: ShieldCheck,
    title: 'Perfiles verificados',
    desc: 'Sistema de verificación de identidad para mayor confianza y seguridad.',
    to: '/verification',
    color: 'bg-purple-100 text-purple-600',
  },
]

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand-dark text-brand-cream overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #f97316 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #ea580c 0%, transparent 40%)`,
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-1.5 text-sm font-semibold text-primary-300 mb-6">
            🇵🇾 Solo en Paraguay por ahora
          </div>
          <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-none mb-6">
            Encontrá tu<br />
            <span className="text-primary-400">roomie ideal</span>
          </h1>
          <p className="text-orange-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
            JAIKO! conecta personas que buscan compartir alquiler con quienes publican
            habitaciones y departamentos. Compatible, seguro y simple.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated() ? (
              <Link to="/search" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 justify-center">
                Buscar roomies <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/login" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 justify-center">
                Empezar ahora <ArrowRight size={18} />
              </Link>
            )}
            <Link to="/listings" className="btn-secondary text-lg px-8 py-3 border-primary-400 text-primary-300 hover:bg-primary-500/10">
              Ver departamentos
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-4">
          Todo lo que necesitás
        </h2>
        <p className="text-center text-orange-400 mb-12 max-w-xl mx-auto">
          Una sola plataforma para encontrar roomies compatibles, publicar vivienda y coordinar la búsqueda en grupo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, to, color }) => (
            <Link key={to} to={to}
              className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col gap-3">
              <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
                <Icon size={22} />
              </div>
              <h3 className="font-display font-bold text-lg">{title}</h3>
              <p className="text-sm text-gray-500 flex-1">{desc}</p>
              <span className="text-primary-500 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Ver más <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-orange-100 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Creá tu perfil', desc: 'Completá tus preferencias de convivencia: presupuesto, mascotas, horarios y más.' },
              { step: '02', title: 'Encontrá compatibles', desc: 'El algoritmo muestra perfiles con 80%+ de compatibilidad con vos.' },
              { step: '03', title: 'Conectate y mudarte', desc: 'Chateá, formá un grupo y encontrá el departamento ideal juntos.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary-500 text-white font-display font-extrabold text-xl flex items-center justify-center shadow-lg shadow-primary-200">
                  {step}
                </div>
                <h3 className="font-display font-bold text-lg">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated() && (
        <section className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-extrabold text-4xl mb-4">
            Listo para encontrar tu <span className="text-primary-500">roomie</span>?
          </h2>
          <p className="text-gray-500 mb-8">Creá tu cuenta con Google y empezá a buscar hoy.</p>
          <Link to="/login" className="btn-primary text-lg px-10 py-3">
            Crear cuenta gratis
          </Link>
        </section>
      )}
    </div>
  )
}
