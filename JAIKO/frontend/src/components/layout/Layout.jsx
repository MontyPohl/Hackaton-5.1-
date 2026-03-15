import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, Building2, Users, MessageCircle, Bell, ShieldCheck, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '../../context/authStore'
import useNotifStore from '../../context/notifStore'
import clsx from 'clsx'

const NAV = [
  { to: '/',             label: 'Inicio',        icon: Home },
  { to: '/search',       label: 'Buscar roomies', icon: Search,       auth: true },
  { to: '/listings',     label: 'Departamentos',  icon: Building2 },
  { to: '/groups',       label: 'Grupos',         icon: Users,        auth: true },
  { to: '/chat',         label: 'Chat',           icon: MessageCircle,auth: true },
]

export default function Layout() {
  const { user, profile, logout, isAuthenticated, isAdmin } = useAuthStore()
  const { unread } = useNotifStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-brand-dark text-brand-cream shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="font-display font-extrabold text-2xl text-primary-400 tracking-tight">
            JAIKO<span className="text-white">!</span>
          </NavLink>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.filter(n => !n.auth || isAuthenticated()).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-orange-200 hover:bg-white/10'
                )}
              >
                <Icon size={15} /> {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated() ? (
              <>
                {/* Notifications bell */}
                <NavLink
                  to="/notifications"
                  className="relative p-2 rounded-xl hover:bg-white/10 text-orange-200 transition-all"
                >
                  <Bell size={20} />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </NavLink>

                {/* Admin link */}
                {isAdmin() && (
                  <NavLink to="/admin" className="p-2 rounded-xl hover:bg-white/10 text-orange-200 transition-all">
                    <ShieldCheck size={20} />
                  </NavLink>
                )}

                {/* Avatar */}
                <NavLink to="/profile" className="flex items-center gap-2 pl-2">
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt={profile.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary-400" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-sm">
                      {profile?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-semibold text-orange-100">{profile?.name}</span>
                </NavLink>

                <button onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-white/10 text-orange-300 transition-all"
                  title="Cerrar sesión">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <NavLink to="/login" className="btn-primary text-sm py-2 px-4">
                Entrar
              </NavLink>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 rounded-xl hover:bg-white/10 text-orange-200"
              onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-brand-dark border-t border-white/10 px-4 pb-4 flex flex-col gap-1">
            {NAV.filter(n => !n.auth || isAuthenticated()).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  isActive ? 'bg-primary-500 text-white' : 'text-orange-200 hover:bg-white/10'
                )}
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-brand-dark text-orange-300 text-center py-5 text-sm font-body">
        <span className="font-display font-bold text-primary-400">JAIKO!</span>
        {' '}– Encontrá tu roomie ideal en Paraguay · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
