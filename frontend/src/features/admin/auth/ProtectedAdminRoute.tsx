import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from './adminAuthContext'

export default function ProtectedAdminRoute() {
  const { isAuthenticated, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-sm font-medium text-slate-600">
        Verificando sesion...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
