import { ApiError, apiRequest, buildApiUrl } from './apiClient'
import type { AdminCategoryDto, AdminTagDto } from './adminNewsApi'

export type UpsertAdminCategoryRequest = {
  name: string
  slug?: string | null
  description?: string | null
  sortOrder: number
  isActive: boolean
}

export type UpsertAdminTagRequest = {
  name: string
  slug?: string | null
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string; title?: string }
    return data.message ?? data.title
  } catch {
    return undefined
  }
}

async function taxonomyRequest<T>(path: string, options: RequestInit = {}) {
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

export function getAdminCategories(signal?: AbortSignal) {
  return apiRequest<AdminCategoryDto[]>('/admin/categories', {
    method: 'GET',
    credentials: 'include',
    signal,
  })
}

export function createAdminCategory(payload: UpsertAdminCategoryRequest) {
  return taxonomyRequest<AdminCategoryDto>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminCategory(id: string, payload: UpsertAdminCategoryRequest) {
  return taxonomyRequest<AdminCategoryDto>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteAdminCategory(id: string) {
  return taxonomyRequest<void>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function getAdminTags(signal?: AbortSignal) {
  return apiRequest<AdminTagDto[]>('/admin/tags', {
    method: 'GET',
    credentials: 'include',
    signal,
  })
}

export function createAdminTag(payload: UpsertAdminTagRequest) {
  return taxonomyRequest<AdminTagDto>('/admin/tags', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminTag(id: string, payload: UpsertAdminTagRequest) {
  return taxonomyRequest<AdminTagDto>(`/admin/tags/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteAdminTag(id: string) {
  return taxonomyRequest<void>(`/admin/tags/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
