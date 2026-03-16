import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import useAuthStore from '../context/authStore'

const FEATURES = [
  { icon: '✅', title: 'Perfiles verificados', desc: 'Verificamos identidad y antecedentes para que siempre sepas con quién estás conectando.' },
  { icon: '🤝', title: 'Compatibilidad inteligente', desc: 'Analizamos tus hábitos y preferencias para mostrarte solo los perfiles más compatibles.' },
  { icon: '💰', title: 'Ahorrá hasta un 50%', desc: 'Dividí el alquiler y los servicios entre dos y empezá tu independencia sin presión económica.' },
  { icon: '🔒', title: 'Chat seguro y privado', desc: 'Tu número y datos personales permanecen privados hasta que decidís compartirlos.' },
  { icon: '⭐', title: 'Sistema de reseñas', desc: 'Valoraciones reales de personas que ya compartieron experiencias de convivencia.' },
  { icon: '📍', title: 'Búsqueda por zona', desc: 'Filtrá por barrio, presupuesto, estilo de vida y encontrá tu match perfecto.' },
]

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="flex flex-col font-main bg-[#F4F7FF] text-[#1E293B]">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E4EA6 0%, #2563C8 50%, #3B82F6 100%)' }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-28 text-center text-white">
          <div className="inline-block bg-[rgba(245,166,35,0.2)] border border-[rgba(245,166,35,0.5)] text-[#FBBF24] text-xs font-bold rounded-full px-4 py-1 mb-5">
            ✨ La forma más segura de encontrar roomie
          </div>
          <h1 className="font-alt font-bold text-5xl md:text-7xl leading-tight mb-6">
            Conecta con tu <span className="text-[#FBBF24]">roomie ideal</span> y comparte gastos
          </h1>
          <p className="text-white opacity-85 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            ¿Querés independizarte pero los gastos son muchos? Jaiko te conecta con personas en tu misma situación para que puedan compartir el alquiler juntos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            {isAuthenticated() ? (
              <Link to="/search" className="btn-primary px-8 py-4 bg-[#F5A623] font-bold rounded-lg hover:bg-[#D4891A] transition">
                Encontrar mi roomie <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/login" className="btn-primary px-8 py-4 bg-[#F5A623] font-bold rounded-lg hover:bg-[#D4891A] transition">
                Empezar ahora <ArrowRight size={18} />
              </Link>
            )}
            <Link to="/listings" className="btn-secondary px-8 py-4 border border-white text-white font-bold rounded-lg hover:bg-white/20 transition">
              Ver perfiles
            </Link>
          </div>
          <div className="hero-stats flex flex-wrap justify-center gap-10 mt-12">
            <div className="stat text-center"><div className="stat-num font-alt text-2xl font-bold text-[#FBBF24]">2,400+</div><div className="stat-label text-xs opacity-75 mt-1">Usuarios activos</div></div>
            <div className="stat text-center"><div className="stat-num font-alt text-2xl font-bold text-[#FBBF24]">850+</div><div className="stat-label text-xs opacity-75 mt-1">Conexiones exitosas</div></div>
            <div className="stat text-center"><div className="stat-num font-alt text-2xl font-bold text-[#FBBF24]">98%</div><div className="stat-label text-xs opacity-75 mt-1">Perfiles verificados</div></div>
          </div>
        </div>
      </section>
{/* How it works – versión compacta y centrada */}
<section className="section bg-[#F4F7FF] py-20">
  <h2 className="section-title text-center mb-4 text-4xl md:text-5xl font-alt font-bold">
    ¿Cómo <span className="text-[#2563C8]">funciona</span>?
  </h2>
  <p className="section-sub text-center mb-12 text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto">
    En solo 4 pasos estás conectando con tu futuro roomie de manera segura y divertida
  </p>
  <div className="flex flex-wrap justify-center gap-6">
    {[
      { step: '1', icon: '📝', title: 'Creá tu perfil', desc: 'Contanos sobre vos, tus hábitos, tu presupuesto y la zona donde querés vivir.', bg: 'from-[#EFF6FF] to-[#DBEAFE]' },
      { step: '2', icon: '🔍', title: 'Explorá perfiles', desc: 'Nuestro sistema te muestra personas compatibles según tus preferencias de vida.', bg: 'from-[#FFF7ED] to-[#FFEDD5]' },
      { step: '3', icon: '💬', title: 'Conectá y acordá', desc: 'Chatéen, conózcanse y definan los términos del alquiler compartido juntos.', bg: 'from-[#F0FDF4] to-[#DCFCE7]' },
      { step: '4', icon: '🏡', title: '¡A vivir!', desc: 'Mudense y disfruten de su nuevo hogar compartiendo los gastos equitativamente.', bg: 'from-[#FFF1F2] to-[#FFE4E6]' },
    ].map(({ step, icon, title, desc, bg }) => (
      <div
        key={step}
        className="relative bg-white p-5 w-56 rounded-2xl shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1"
      >
        <div className="step-num absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-[#2563C8] to-[#3B82F6] flex items-center justify-center text-white text-lg font-bold shadow-md">
          {step}
        </div>
        <div className={`step-icon w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center text-4xl bg-gradient-to-br ${bg} shadow-inner`}>
          {icon}
        </div>
        <h3 className="font-alt font-bold text-base text-[#1E293B] mb-1 text-center">{title}</h3>
        <p className="text-sm text-[#64748B] text-center">{desc}</p>
      </div>
    ))}
  </div>
</section>

      {/* Features – versión compacta y centrada */}
      <section className="section py-20 bg-white">
        <h2 className="section-title text-center mb-4 text-4xl md:text-5xl font-alt font-bold">
  ¿Por qué elegir <span className="text-[#2563C8]">JAIK</span><span className="text-[#FBBF24]">O!</span>?
</h2>
        <p className="section-sub text-center mb-12 text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto">
          Diseñado para que encontrar roomie sea seguro, rápido y sin dramas
        </p>
        <div className="features-grid flex flex-wrap justify-center gap-4">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="feat-card flex flex-col items-center text-center gap-2 p-5 w-64 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1 bg-white"
            >
              <div className="feat-icon w-14 h-14 flex items-center justify-center text-3xl rounded-xl mb-2 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] shadow-inner">
                {icon}
              </div>
              <h3 className="font-alt font-bold text-base text-[#1E293B]">{title}</h3>
              <p className="text-sm text-[#64748B]">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}