import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <a
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-brand-ink"
        href="#contenido"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
