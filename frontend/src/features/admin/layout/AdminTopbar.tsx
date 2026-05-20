import { LogOut, Menu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../auth/adminAuthContext'

export default function AdminTopbar() {
  const { adminUser, logout } = useAdminAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 lg:hidden"
            to="/admin/dashboard"
            aria-label="Menu admin"
          >
            <Menu aria-hidden="true" size={18} />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">Administracion</p>
            <p className="truncate text-xs text-slate-500">Gestion de contenidos institucionales</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-950">
              {adminUser?.displayName ?? 'Admin'}
            </p>
            <p className="text-xs text-slate-500">
              {adminUser?.email ?? 'Sesion admin'} · {adminUser?.role ?? 'Editor'}
            </p>
          </div>
          <button
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-brand-green hover:bg-brand-mint/40"
            type="button"
            onClick={handleLogout}
          >
            <LogOut aria-hidden="true" size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-2 text-sm lg:hidden">
        <Link className="focus-ring shrink-0 rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100" to="/admin/noticias">
          Noticias
        </Link>
        <Link className="focus-ring shrink-0 rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100" to="/admin/media">
          Media
        </Link>
        <Link className="focus-ring shrink-0 rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100" to="/">
          Ver sitio
        </Link>
      </nav>
    </header>
  )
}
