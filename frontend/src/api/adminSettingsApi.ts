import { ApiError, buildApiUrl } from './apiClient'

export type AdminSiteSetting = {
  key: string
  value: string
  type: string
  isPublic: boolean
  updatedAt?: string | null
}

export type UpdateAdminSiteSettingRequest = {
  value: string
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string; title?: string }
    return data.message ?? data.title
  } catch {
    return undefined
  }
}

async function settingsRequest<T>(path: string, options: RequestInit = {}) {
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

export function getAdminSettings(signal?: AbortSignal) {
  return settingsRequest<AdminSiteSetting[]>('/admin/settings', {
    method: 'GET',
    signal,
  })
}

export function updateAdminSetting(key: string, payload: UpdateAdminSiteSettingRequest) {
  return settingsRequest<AdminSiteSetting>(`/admin/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
