import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { DONATION_URL, logoUrl } from '../data/site'
import Navbar from './Navbar'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex min-h-20 items-center justify-between gap-4">
        <Link
          className="focus-ring flex items-center rounded-md"
          to="/"
          aria-label="Inicio"
          onClick={() => setIsOpen(false)}
        >
          <img className="h-auto w-40 sm:w-48" src={logoUrl} alt="Construyendo Un Nosotros" />
        </Link>
        <div className="flex items-center gap-3">
          <Navbar />
          <Button className="hidden lg:inline-flex" href={DONATION_URL}>
            Donar
          </Button>
          <button
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-brand-ink lg:hidden"
            type="button"
            aria-label={isOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      {isOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-page grid gap-4 py-4">
            <Navbar vertical onNavigate={() => setIsOpen(false)} />
            <Button href={DONATION_URL}>Donar</Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
