import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../context/authStore'

// ✅ CORRECCIÓN: Agregamos el chequeo de `loading`, igual que ProtectedRoute.
//
// Por qué es necesario:
// Cuando un admin recarga la página en /admin, el store arranca con
// user = null (aún no hizo fetchMe()). Sin este chequeo, isAdmin()
// devuelve false inmediatamente → redirige al home ANTES de que el
// servidor confirme que el usuario es admin → el admin nunca puede
// acceder recargando directamente en su ruta.
//
// Con loading = true, mostramos el spinner mientras fetchMe() termina,
// y recién entonces evaluamos si es admin o no.
export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-primary-500 font-display text-xl">
        Cargando...
      </div>
    )
  }

  if (!isAuthenticated()) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/" replace />
  return <Outlet />
}
