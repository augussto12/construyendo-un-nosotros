import { ApiError, buildApiUrl } from './apiClient'

export type AdminUserRole = 'Admin' | 'Editor'

export type AdminBackofficeUser = {
  id: string
  email: string
  displayName: string
  role: AdminUserRole
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateAdminUserRequest = {
  email: string
  displayName: string
  role: AdminUserRole
  password: string
}

export type UpdateAdminUserRequest = {
  email: string
  displayName: string
  role: AdminUserRole
}

export type ResetAdminUserPasswordRequest = {
  password: string
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string; title?: string }
    return data.message ?? data.title
  } catch {
    return undefined
  }
}

async function usersRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, (await readErrorMessage(response)) ?? 'La accion no pudo completarse.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function getAdminUsers(signal?: AbortSignal) {
  return usersRequest<AdminBackofficeUser[]>('/admin/users', {
    method: 'GET',
    signal,
  })
}

export function getAdminUserById(id: string, signal?: AbortSignal) {
  return usersRequest<AdminBackofficeUser>(`/admin/users/${id}`, {
    method: 'GET',
    signal,
  })
}

export function createAdminUser(payload: CreateAdminUserRequest) {
  return usersRequest<AdminBackofficeUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminUser(id: string, payload: UpdateAdminUserRequest) {
  return usersRequest<AdminBackofficeUser>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function activateAdminUser(id: string) {
  return usersRequest<AdminBackofficeUser>(`/admin/users/${id}/activate`, {
    method: 'POST',
  })
}

export function deactivateAdminUser(id: string) {
  return usersRequest<AdminBackofficeUser>(`/admin/users/${id}/deactivate`, {
    method: 'POST',
  })
}

export function resetAdminUserPassword(id: string, payload: ResetAdminUserPasswordRequest) {
  return usersRequest<void>(`/admin/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
