import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Building2, Users, MessageCircle, Bell, ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../context/authStore';
import useNotifStore from '../../context/notifStore';
import clsx from 'clsx';
import logo from '../../assets/logo.png';

const NAV = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/search', label: 'Buscar roomies', icon: Search, auth: true },
  { to: '/listings', label: 'Departamentos', icon: Building2 },
  { to: '/groups', label: 'Grupos', icon: Users, auth: true },
  { to: '/chat', label: 'Chat', icon: MessageCircle, auth: true },
];

export default function Layout() {
  const { profile, logout, isAuthenticated, isAdmin } = useAuthStore();
  const { unread } = useNotifStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-dvh flex flex-col font-main">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#2563C8] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/">
            <img src={logo} alt="JAIKO!" className="h-10 w-auto" />
          </NavLink>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-2">
            {NAV.filter(n => !n.auth || isAuthenticated()).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                    isActive ? 'bg-[#FBBF24] text-[#2563C8]' : 'text-white hover:bg-white/10'
                  )
                }
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
                  className="relative p-2 rounded-xl hover:bg-white/10 text-white transition-all"
                >
                  <Bell size={20} />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#FBBF24] text-[#2563C8] text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </NavLink>

                {/* Admin link */}
                {isAdmin() && (
                  <NavLink to="/admin" className="p-2 rounded-xl hover:bg-white/10 text-white transition-all">
                    <ShieldCheck size={20} />
                  </NavLink>
                )}

                {/* Avatar */}
                <NavLink to="/profile" className="flex items-center gap-2 pl-2">
                  {profile?.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt={profile.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#FBBF24]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#FBBF24] flex items-center justify-center font-bold text-sm text-[#2563C8]">
                      {profile?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-semibold text-white">{profile?.name}</span>
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-white/10 text-white transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="btn-primary text-sm py-2 px-4 bg-[#FBBF24] text-[#2563C8] font-bold rounded-lg hover:bg-[#D4891A] transition-all"
              >
                Entrar
              </NavLink>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/10 text-white"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#2563C8] px-4 pb-4 flex flex-col gap-1">
            {NAV.filter(n => !n.auth || isAuthenticated()).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    isActive ? 'bg-[#FBBF24] text-[#2563C8]' : 'text-white hover:bg-white/10'
                  )
                }
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
      <footer className="bg-[#2563C8] text-white text-center py-5 text-sm font-body">
        <span className="font-alt font-bold text-[#FBBF24]">JAIKO!</span> – Encontrá tu roomie ideal en Paraguay ·{' '}
        {new Date().getFullYear()}
      </footer>
    </div>
  );
}