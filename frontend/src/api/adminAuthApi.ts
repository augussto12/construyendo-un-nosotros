import { apiRequest } from './apiClient'

export type AdminUserDto = {
  id: string
  email: string
  displayName: string
  role: 'Admin' | 'Editor' | string
}

export type AuthMeResponse = {
  isAuthenticated: boolean
  user: AdminUserDto | null
}

export type LoginRequest = {
  email: string
  password: string
}

export function loginAdmin(request: LoginRequest) {
  return apiRequest<AuthMeResponse>('/admin/auth/login', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(request),
  })
}

export function logoutAdmin() {
  return apiRequest<void>('/admin/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
}

export function getAdminMe(signal?: AbortSignal) {
  return apiRequest<AuthMeResponse>('/admin/auth/me', {
    method: 'GET',
    credentials: 'include',
    signal,
  })
}
