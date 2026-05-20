import {
  FileText,
  Gauge,
  Home,
  Image,
  Settings,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAdminAuth } from '../auth/adminAuthContext'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: Gauge },
  { label: 'Noticias', to: '/admin/noticias', icon: FileText },
  { label: 'Media', to: '/admin/media', icon: Image },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const { adminUser } = useAdminAuth()
  const isAdmin = adminUser?.role === 'Admin'
  const visibleItems = isAdmin
    ? [...navItems, { label: 'Usuarios', to: '/admin/usuarios', icon: Users }]
    : navItems.filter((item) => item.to !== '/admin/settings')

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Backoffice
        </p>
        <p className="mt-1 text-base font-semibold text-slate-950">
          Construyendo Un Nosotros
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {visibleItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              className={({ isActive }) =>
                `focus-ring inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-mint text-brand-ink'
                    : 'text-slate-650 hover:bg-slate-100 hover:text-slate-950'
                }`
              }
              key={item.to}
              to={item.to}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <NavLink
          className="focus-ring inline-flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-650 hover:bg-slate-100 hover:text-slate-950"
          to="/"
        >
          <Home aria-hidden="true" size={18} />
          <span>Ver sitio</span>
        </NavLink>
      </div>
    </aside>
  )
}
