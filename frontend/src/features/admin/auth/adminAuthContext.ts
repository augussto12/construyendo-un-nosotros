import { createContext, useContext } from 'react'
import type { AdminUserDto } from '../../../api/adminAuthApi'

export type AdminAuthContextValue = {
  adminUser: AdminUserDto | null
  loading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }

  return context
}
