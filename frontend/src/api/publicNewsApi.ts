import { apiGet } from './apiClient'
import type {
  PublicPagedResultDto,
  PublicNewsCategoryDto,
  PublicNewsDetailDto,
  PublicNewsListItemDto,
  PublicNewsTagDto,
} from '../types'

export async function getPublicNews(signal?: AbortSignal) {
  const response = await apiGet<
    PublicNewsListItemDto[] | PublicPagedResultDto<PublicNewsListItemDto>
  >('/public/news', signal)

  return Array.isArray(response) ? response : response.items
}

export function getFeaturedPublicNews(signal?: AbortSignal) {
  return apiGet<PublicNewsListItemDto[]>('/public/news/featured', signal)
}

export function getPublicNewsBySlug(slug: string, signal?: AbortSignal) {
  return apiGet<PublicNewsDetailDto>(`/public/news/${encodeURIComponent(slug)}`, signal)
}

export function getPublicNewsCategories(signal?: AbortSignal) {
  return apiGet<PublicNewsCategoryDto[]>('/public/categories', signal)
}

export function getPublicNewsTags(signal?: AbortSignal) {
  return apiGet<PublicNewsTagDto[]>('/public/tags', signal)
}
