import React, { useState, useEffect } from 'react';
// ✅ CORRECCIÓN: Importamos Outlet junto con los demás hooks de react-router-dom.
// Outlet es el "slot" donde React Router v6 inyecta la página hija activa.
// Sin él, el Layout no sabe dónde poner HomePage, ChatPage, etc.
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Users, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import useAuthStore from '../../context/authStore';
import useNotifStore from '../../context/notifStore';
import { Avatar } from '../ui';
import Logo from '../ui/Logo';
import clsx from 'clsx';

const Navbar = () => {
  const { isAuthenticated, user, profile } = useAuthStore();
  const { unread } = useNotifStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', label: 'Inicio', icon: Home },
    ...(isAuthenticated() ? [
      { to: '/search', label: 'Buscar Roomie', icon: Sparkles },
      { to: '/listings', label: 'Departamentos', icon: Search },
      { to: '/groups', label: 'Grupos', icon: Users },
      { to: '/chat', label: 'Chat', icon: MessageSquare },
    ] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={clsx(
      'fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 py-4',
      isScrolled ? 'bg-white/90 backdrop-blur-lg border-b border-orange-100 py-3' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo className="w-10 h-10" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.to} 
              to={link.to} 
              className={clsx(
                'text-sm font-bold transition-colors hover:text-orange-500',
                isActive(link.to) ? 'text-blue-600' : 'text-blue-900'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated() ? (
            <>
              <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-orange-500 transition-colors">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
                )}
              </Link>
              <Link to="/profile" className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">{profile?.name || user?.email}</p>
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Mi Perfil</p>
                </div>
                <Avatar src={profile?.profile_photo_url} name={profile?.name} size="sm" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                Ingresar
              </Link>
              <Link to="/register" className="btn-primary py-2.5 text-sm">
                Registrarse
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-slate-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={clsx(
        'fixed inset-0 top-[72px] bg-white z-40 transition-transform duration-500 md:hidden p-8',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex flex-col gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.to} 
              to={link.to} 
              onClick={() => setIsOpen(false)}
              className={clsx(
                'text-2xl font-display font-extrabold flex items-center gap-4',
                isActive(link.to) ? 'text-orange-500' : 'text-slate-900'
              )}
            >
              <link.icon className="w-6 h-6" />
              {link.label}
            </Link>
          ))}
          <hr className="border-slate-100 my-4" />
          {isAuthenticated() ? (
            <>
              <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-2xl font-display font-extrabold text-slate-900">
                <User className="w-6 h-6" /> Mi Perfil
              </Link>
              <Link to="/notifications" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-2xl font-display font-extrabold text-slate-900">
                <Bell className="w-6 h-6" /> Notificaciones
              </Link>
              <button className="flex items-center gap-4 text-2xl font-display font-extrabold text-red-500 mt-4">
                <LogOut className="w-6 h-6" /> Salir
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 pt-4">
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-secondary text-center">Ingresar</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="btn-primary text-center">Registrarse</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const BottomNav = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated()) return null;

  const mobileLinks = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/search', label: 'Roomies', icon: Sparkles },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/notifications', label: 'Notif', icon: Bell },
    { to: '/profile', label: 'Perfil', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-orange-100 z-50 px-2 pb-safe">
      <div className="flex items-center justify-around py-3">
        {mobileLinks.map((link) => (
          <Link 
            key={link.to} 
            to={link.to} 
            className={clsx(
              'flex flex-col items-center gap-1 transition-all duration-300',
              isActive(link.to) ? 'text-orange-500 scale-110' : 'text-blue-900 opacity-60'
            )}
          >
            <link.icon size={20} strokeWidth={isActive(link.to) ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ✅ CORRECCIÓN: Eliminamos el prop { children } porque Layout ya NO lo necesita.
// React Router v6 inyecta la página activa a través de <Outlet />, no por props.
// Antes: Layout recibía children = undefined → main quedaba vacío → pantalla blanca.
const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        {/* ✅ CORRECCIÓN CLAVE: <Outlet /> reemplaza a {children}.
            Outlet es el punto de montaje donde React Router renderiza
            la ruta hija activa (HomePage, ChatPage, etc.). */}
        <Outlet />
      </main>
      <BottomNav />
      <footer className="hidden md:block bg-blue-950 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <Logo className="w-10 h-10" />
            </Link>
            <p className="text-blue-200/60 max-w-sm leading-relaxed">
              La plataforma líder en Paraguay para encontrar el compañero de hogar ideal. Seguridad, rapidez y compatibilidad en un solo lugar.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-lg">Plataforma</h4>
            <ul className="space-y-4 text-blue-200/60 text-sm">
              <li><Link to="/search" className="hover:text-white transition-colors">Buscar Roomies</Link></li>
              <li><Link to="/listings" className="hover:text-white transition-colors">Departamentos</Link></li>
              <li><Link to="/groups" className="hover:text-white transition-colors">Grupos</Link></li>
              <li><Link to="/verification" className="hover:text-white transition-colors">Verificación</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-lg">Legal</h4>
            <ul className="space-y-4 text-blue-200/60 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 mt-20 pt-8 text-center text-blue-200/30 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} JAIKO! — Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
