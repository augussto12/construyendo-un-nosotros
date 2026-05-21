import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../auth/adminAuthContext'

type AdminTopbarProps = {
  isMobileMenuOpen: boolean
  onOpenMenu: () => void
}

export default function AdminTopbar({ isMobileMenuOpen, onOpenMenu }: AdminTopbarProps) {
  const { adminUser, logout } = useAdminAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 lg:hidden"
            type="button"
            aria-label="Menu admin"
            aria-controls="admin-mobile-menu"
            aria-expanded={isMobileMenuOpen}
            onClick={onOpenMenu}
          >
            <Menu aria-hidden="true" size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">Administracion</p>
            <p className="truncate text-xs text-slate-500">
              Gestion de contenidos institucionales
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-950">
              {adminUser?.displayName ?? 'Admin'}
            </p>
            <p className="text-xs text-slate-500">
              {adminUser?.email ?? 'Sesion admin'} - {adminUser?.role ?? 'Editor'}
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
    </header>
  )
}
