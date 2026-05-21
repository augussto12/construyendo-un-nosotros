import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            isMobileMenuOpen={isMobileMenuOpen}
            onOpenMenu={() => setIsMobileMenuOpen(true)}
          />
          <main className="flex-1 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
