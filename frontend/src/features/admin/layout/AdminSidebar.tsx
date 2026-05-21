import {
  FileText,
  Gauge,
  Home,
  Image,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAdminAuth } from '../auth/adminAuthContext'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: Gauge },
  { label: 'Noticias', to: '/admin/noticias', icon: FileText },
  { label: 'Media', to: '/admin/media', icon: Image },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

type AdminSidebarProps = {
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

type VisibleNavItem = (typeof navItems)[number] | { label: 'Usuarios'; to: string; icon: typeof Users }

function SidebarHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Backoffice
        </p>
        <p className="mt-1 text-base font-semibold text-slate-950">
          Construyendo Un Nosotros
        </p>
      </div>
      {onClose ? (
        <button
          className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
          type="button"
          onClick={onClose}
          aria-label="Cerrar menu admin"
        >
          <X aria-hidden="true" size={18} />
        </button>
      ) : null}
    </div>
  )
}

function NavItems({
  items,
  onNavigate,
}: {
  items: VisibleNavItem[]
  onNavigate?: () => void
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            className={({ isActive }) =>
              `focus-ring inline-flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-mint text-brand-ink'
                  : 'text-slate-650 hover:bg-slate-100 hover:text-slate-950'
              }`
            }
            key={item.to}
            to={item.to}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </>
  )
}

function SiteLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <NavLink
      className="focus-ring inline-flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-650 hover:bg-slate-100 hover:text-slate-950"
      to="/"
      onClick={onNavigate}
    >
      <Home aria-hidden="true" size={18} />
      <span>Ver sitio</span>
    </NavLink>
  )
}

export default function AdminSidebar({
  isMobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const { adminUser } = useAdminAuth()
  const isAdmin = adminUser?.role === 'Admin'
  const visibleItems: VisibleNavItem[] = isAdmin
    ? [...navItems, { label: 'Usuarios', to: '/admin/usuarios', icon: Users }]
    : navItems.filter((item) => item.to !== '/admin/settings')

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <SidebarHeader />
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <NavItems items={visibleItems} />
        </nav>
        <div className="border-t border-slate-200 p-3">
          <SiteLink />
        </div>
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 h-full w-full bg-slate-950/45"
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menu admin"
          />
          <aside
            className="relative flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-xl"
            id="admin-mobile-menu"
          >
            <SidebarHeader onClose={onCloseMobile} />
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              <NavItems items={visibleItems} onNavigate={onCloseMobile} />
            </nav>
            <div className="border-t border-slate-200 p-3">
              <SiteLink onNavigate={onCloseMobile} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
