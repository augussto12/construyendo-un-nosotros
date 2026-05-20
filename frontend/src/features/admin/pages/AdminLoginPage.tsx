import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../auth/adminAuthContext'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export default function AdminLoginPage() {
  const { error, isAuthenticated, loading, login } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from?.pathname ?? '/admin/dashboard'

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, redirectTo])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    const success = await login(email, password)
    if (success) {
      navigate(redirectTo, { replace: true })
    }
  }

  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
              Backoffice
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
              Iniciar sesion
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Acceso para administradores y editores de contenido.
            </p>
          </div>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <span className="inline-flex items-baseline gap-1">
                Email <span className="text-red-600">*</span>
              </span>
              <input
                className="focus-ring min-h-11 rounded-md border border-slate-200 bg-white px-3 text-base text-slate-950 outline-none transition hover:border-slate-300"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <span className="inline-flex items-baseline gap-1">
                Password <span className="text-red-600">*</span>
              </span>
              <input
                className="focus-ring min-h-11 rounded-md border border-slate-200 bg-white px-3 text-base text-slate-950 outline-none transition hover:border-slate-300"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {submitted && error ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {error}
              </p>
            ) : null}

            <button
              className="focus-ring mt-2 inline-flex min-h-11 items-center justify-center rounded-md border border-brand-green bg-brand-green px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
