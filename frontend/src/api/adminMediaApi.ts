import { ApiError, apiRequest, buildApiUrl } from './apiClient'

export type AdminMediaAsset = {
  id: string
  fileName: string
  originalFileName: string
  url: string
  mimeType: string
  extension: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  altText?: string | null
  createdAt: string
}

export type UploadMediaResponse = {
  media: AdminMediaAsset
}

export type AdminNewsImage = {
  id: string
  mediaAssetId: string
  media: AdminMediaAsset
  caption?: string | null
  altText?: string | null
  sortOrder: number
  isMain: boolean
  createdAt: string
}

export type AddGalleryImageRequest = {
  mediaAssetId: string
  caption?: string | null
  altText?: string | null
  sortOrder: number
}

export type GalleryOrderItem = {
  imageId: string
  sortOrder: number
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string; title?: string }
    return data.message ?? data.title
  } catch {
    return undefined
  }
}

async function mediaRequest<T>(path: string, options: RequestInit = {}) {
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

export async function uploadMedia(file: File, altText?: string | null) {
  const formData = new FormData()
  formData.append('file', file)
  if (altText?.trim()) {
    formData.append('altText', altText.trim())
  }

  const response = await fetch(buildApiUrl('/admin/media'), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(response.status, (await readErrorMessage(response)) ?? 'No se pudo subir la imagen.')
  }

  return response.json() as Promise<UploadMediaResponse>
}

export function getMedia(_params?: Record<string, never>, signal?: AbortSignal) {
  return apiRequest<AdminMediaAsset[]>('/admin/media', {
    method: 'GET',
    credentials: 'include',
    signal,
  })
}

export function getMediaById(id: string, signal?: AbortSignal) {
  return apiRequest<AdminMediaAsset>(`/admin/media/${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'include',
    signal,
  })
}

export function deleteMedia(id: string) {
  return mediaRequest<void>(`/admin/media/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function setMainImage(newsId: string, mediaAssetId: string) {
  return mediaRequest<AdminMediaAsset>(`/admin/news/${encodeURIComponent(newsId)}/main-image`, {
    method: 'POST',
    body: JSON.stringify({ mediaAssetId }),
  })
}

export function removeMainImage(newsId: string) {
  return mediaRequest<void>(`/admin/news/${encodeURIComponent(newsId)}/main-image`, {
    method: 'DELETE',
  })
}

export function addGalleryImage(newsId: string, payload: AddGalleryImageRequest) {
  return mediaRequest<AdminNewsImage>(`/admin/news/${encodeURIComponent(newsId)}/gallery`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function removeGalleryImage(newsId: string, imageId: string) {
  return mediaRequest<void>(
    `/admin/news/${encodeURIComponent(newsId)}/gallery/${encodeURIComponent(imageId)}`,
    {
      method: 'DELETE',
    },
  )
}

export function updateGalleryOrder(newsId: string, items: GalleryOrderItem[]) {
  return mediaRequest<void>(`/admin/news/${encodeURIComponent(newsId)}/gallery-order`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}
