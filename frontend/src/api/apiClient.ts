const API_URL = import.meta.env.VITE_API_URL?.trim()

export class ApiError extends Error {
  status: number

  constructor(status: number, message = `API request failed with status ${status}`) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function hasApiBaseUrl() {
  return Boolean(API_URL)
}

export function buildApiUrl(path: string) {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not configured')
  }

  const baseUrl = API_URL.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${normalizedPath}`
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new ApiError(response.status)
  }

  return response.json() as Promise<T>
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function buildPublicAssetUrl(url?: string) {
  if (!url || !API_URL || /^https?:\/\//i.test(url)) {
    return url
  }

  const apiBase = new URL(API_URL, window.location.origin)
  return `${apiBase.origin}${url.startsWith('/') ? url : `/${url}`}`
}
