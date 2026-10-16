import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Ruta protegida: sin sesión redirige a /login; con sesión renderiza las rutas hijas. */
export default function RequireAuth() {
  const { operator } = useAuth()
  if (!operator) return <Navigate to="/login" replace />
  return <Outlet />
}
