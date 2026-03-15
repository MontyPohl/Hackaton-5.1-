import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../context/authStore'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthStore()
  if (loading) return <div className="flex items-center justify-center h-64 text-primary-500 font-display text-xl">Cargando...</div>
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />
}
