import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedAdminRoute from './features/admin/auth/ProtectedAdminRoute'
import { AdminAuthProvider } from './features/admin/auth/adminAuthStore'
import AdminLayout from './features/admin/layout/AdminLayout'
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage'
import AdminLoginPage from './features/admin/pages/AdminLoginPage'
import AdminMediaPage from './features/admin/pages/AdminMediaPage'
import AdminNewsListPage from './features/admin/pages/AdminNewsListPage'
import AdminSettingsPage from './features/admin/pages/AdminSettingsPage'
import AdminUsersPage from './features/admin/pages/AdminUsersPage'
import MainLayout from './layout/MainLayout'
import AntecedentesPage from './pages/AntecedentesPage'
import ContactPage from './pages/ContactPage'
import DonatePage from './pages/DonatePage'
import HomePage from './pages/HomePage'
import NewsDetailPage from './pages/NewsDetailPage'
import NewsPage from './pages/NewsPage'
import NotFoundPage from './pages/NotFoundPage'

const AdminNewsEditorPage = lazy(() => import('./features/admin/pages/AdminNewsEditorPage'))

function AdminRouteFallback() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
      Cargando modulo...
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <AdminAuthProvider>
            <Navigate to="/admin/dashboard" replace />
          </AdminAuthProvider>
        }
      />
      <Route
        path="/admin/login"
        element={
          <AdminAuthProvider>
            <AdminLoginPage />
          </AdminAuthProvider>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminAuthProvider>
            <ProtectedAdminRoute />
          </AdminAuthProvider>
        }
      >
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="noticias" element={<AdminNewsListPage />} />
          <Route
            path="noticias/nueva"
            element={
              <Suspense fallback={<AdminRouteFallback />}>
                <AdminNewsEditorPage />
              </Suspense>
            }
          />
          <Route
            path="noticias/:id"
            element={
              <Suspense fallback={<AdminRouteFallback />}>
                <AdminNewsEditorPage />
              </Suspense>
            }
          />
          <Route path="media" element={<AdminMediaPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
        </Route>
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/antecedentes" element={<AntecedentesPage />} />
        <Route path="/noticias" element={<NewsPage />} />
        <Route path="/noticias/:slug" element={<NewsDetailPage />} />
        <Route
          path="/etapa-constructiva"
          element={<Navigate to="/antecedentes?tab=construccion" replace />}
        />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/donar" element={<DonatePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
