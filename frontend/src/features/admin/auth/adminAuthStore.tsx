import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getAdminMe,
  loginAdmin,
  logoutAdmin,
  type AdminUserDto,
} from '../../../api/adminAuthApi'
import { AdminAuthContext, type AdminAuthContextValue } from './adminAuthContext'

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUserDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshMe = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getAdminMe()
      setAdminUser(response.isAuthenticated ? response.user : null)
    } catch {
      setAdminUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    getAdminMe(controller.signal)
      .then((response) => {
        setAdminUser(response.isAuthenticated ? response.user : null)
      })
      .catch(() => {
        setAdminUser(null)
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await loginAdmin({ email, password })
      setAdminUser(response.isAuthenticated ? response.user : null)
      return response.isAuthenticated && Boolean(response.user)
    } catch {
      setAdminUser(null)
      setError('Credenciales invalidas o sesion no disponible.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await logoutAdmin()
    } finally {
      setAdminUser(null)
      setLoading(false)
    }
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      adminUser,
      loading,
      isAuthenticated: Boolean(adminUser),
      error,
      login,
      logout,
      refreshMe,
    }),
    [adminUser, error, loading, login, logout, refreshMe],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
