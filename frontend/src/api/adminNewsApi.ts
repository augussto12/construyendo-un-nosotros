import { apiRequest } from './apiClient'
import type { AdminMediaAsset, AdminNewsImage } from './adminMediaApi'

export type AdminNewsStatus =
  | 'Draft'
  | 'Published'
  | 'Scheduled'
  | 'Unpublished'
  | 'Expired'
  | 'Archived'

export type AdminCategoryDto = {
  id: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  isActive: boolean
}

export type AdminTagDto = {
  id: string
  name: string
  slug: string
}

export type AdminNewsListItem = {
  id: string
  title: string
  slug: string
  excerpt: string
  status: AdminNewsStatus | string
  publishedAt?: string | null
  scheduledAt?: string | null
  expiresAt?: string | null
  authorName?: string | null
  isFeatured: boolean
  featuredOrder: number
  sortOrder: number
  category?: AdminCategoryDto | null
  tags: AdminTagDto[]
  createdAt: string
  updatedAt: string
}

export type AdminNewsDetail = AdminNewsListItem & {
  contentHtml: string
  seoTitle?: string | null
  seoDescription?: string | null
  sourceUrl?: string | null
  videoUrl?: string | null
  videoProvider?: string | null
  mainImage?: AdminMediaAsset | null
  gallery: AdminNewsImage[]
}

export type AdminPagedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type AdminNewsListParams = {
  search?: string
  status?: AdminNewsStatus | ''
  categoryId?: string
  tagId?: string
  featured?: boolean
  page?: number
  pageSize?: number
  sort?: string
}

export type FeaturedOrderItem = {
  id: string
  featuredOrder: number
}

export type UpsertAdminNewsRequest = {
  title: string
  slug?: string | null
  excerpt: string
  contentHtml: string
  status?: AdminNewsStatus
  publishedAt?: string | null
  expiresAt?: string | null
  authorName?: string | null
  isFeatured: boolean
  featuredOrder: number
  sortOrder: number
  seoTitle?: string | null
  seoDescription?: string | null
  sourceUrl?: string | null
  videoUrl?: string | null
  videoProvider?: string | null
  categoryId?: string | null
  tagIds?: string[]
}

function buildQuery(params: AdminNewsListParams = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    query.set(key, String(value))
  })

  const value = query.toString()
  return value ? `?${value}` : ''
}

export function getAdminNews(params?: AdminNewsListParams, signal?: AbortSignal) {
  return apiRequest<AdminPagedResult<AdminNewsListItem>>(`/admin/news${buildQuery(params)}`, {
    method: 'GET',
    credentials: 'include',
    signal,
  })
}

export function getAdminNewsById(id: string, signal?: AbortSignal) {
  return apiRequest<AdminNewsDetail>(`/admin/news/${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'include',
    signal,
  })
}

export function createNews(payload: UpsertAdminNewsRequest) {
  return apiRequest<AdminNewsDetail>('/admin/news', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(payload),
  })
}

export function updateNews(id: string, payload: UpsertAdminNewsRequest) {
  return apiRequest<AdminNewsDetail>(`/admin/news/${encodeURIComponent(id)}`, {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(payload),
  })
}

export function publishNews(id: string) {
  return apiRequest<AdminNewsDetail>(`/admin/news/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
    credentials: 'include',
  })
}

export function unpublishNews(id: string) {
  return apiRequest<AdminNewsDetail>(`/admin/news/${encodeURIComponent(id)}/unpublish`, {
    method: 'POST',
    credentials: 'include',
  })
}

export function archiveNews(id: string) {
  return apiRequest<AdminNewsDetail>(`/admin/news/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
    credentials: 'include',
  })
}

export function scheduleNews(id: string, publishedAt: string) {
  return apiRequest<AdminNewsDetail>(`/admin/news/${encodeURIComponent(id)}/schedule`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ publishedAt }),
  })
}

export function updateFeaturedOrder(items: FeaturedOrderItem[]) {
  return apiRequest<void>('/admin/news/featured-order', {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify({ items }),
  })
}
