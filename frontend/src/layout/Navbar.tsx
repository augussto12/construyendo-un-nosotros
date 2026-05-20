import { NavLink } from 'react-router-dom'
import { navItems } from '../data/site'

type NavbarProps = {
  vertical?: boolean
  onNavigate?: () => void
}

export default function Navbar({ vertical = false, onNavigate }: NavbarProps) {
  return (
    <nav aria-label="Navegacion principal">
      <ul className={vertical ? 'grid gap-2' : 'hidden items-center gap-1 lg:flex'}>
        {navItems.map((item) => (
          <li key={item.href}>
            <NavLink
              className={({ isActive }) =>
                `focus-ring block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-mint text-brand-ink'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-brand-ink'
                }`
              }
              onClick={onNavigate}
              to={item.href}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
