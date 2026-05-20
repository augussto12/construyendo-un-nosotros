import { news } from '../data/news'
import { buildPublicAssetUrl, hasApiBaseUrl } from '../api/apiClient'
import {
  getFeaturedPublicNews,
  getPublicNews,
  getPublicNewsBySlug,
} from '../api/publicNewsApi'
import type {
  NewsItem,
  PublicMediaAssetDto,
  PublicNewsDetailDto,
  PublicNewsImageDto,
  PublicNewsListItemDto,
} from '../types'

function formatDateLabel(value?: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function categoryName(item: PublicNewsListItemDto) {
  return item.category?.name ?? 'Noticias'
}

function mapMediaAsset(item?: PublicMediaAssetDto) {
  if (!item) {
    return undefined
  }

  return {
    ...item,
    url: buildPublicAssetUrl(item.url) ?? item.url,
  }
}

function mapNewsImage(item: PublicNewsImageDto): PublicNewsImageDto {
  return {
    ...item,
    url: buildPublicAssetUrl(item.url) ?? item.url,
  }
}

function mapListItem(item: PublicNewsListItemDto): NewsItem {
  const mainImage = mapMediaAsset(item.mainImage)
  const ogImage = mapMediaAsset(item.ogImage)

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    category: categoryName(item),
    dateLabel: item.dateLabel ?? formatDateLabel(item.publishedAt),
    imageUrl: mainImage?.url,
    content: [],
    video: item.video,
    tags: item.tags,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    ogImage,
    isFeatured: item.isFeatured,
    featuredOrder: item.featuredOrder,
  }
}

function mapDetail(item: PublicNewsDetailDto): NewsItem {
  return {
    ...mapListItem(item),
    sourceUrl: item.sourceUrl,
    contentHtml: item.contentHtml,
    content: item.content ?? [],
    gallery: item.gallery?.map(mapNewsImage),
    status: item.status,
    scheduledAt: item.scheduledAt,
    authorName: item.authorName,
  }
}

function fallbackFeaturedNews() {
  return news.slice(0, 3)
}

async function resolveWithFallback<T>(apiCall: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!hasApiBaseUrl()) {
    return fallback()
  }

  try {
    return await apiCall()
  } catch (error) {
    console.warn('Using local news fallback because the public API is unavailable.', error)
    return fallback()
  }
}

export function getNews(signal?: AbortSignal) {
  return resolveWithFallback(
    async () => (await getPublicNews(signal)).map(mapListItem),
    () => news,
  )
}

export function getFeaturedNews(signal?: AbortSignal) {
  return resolveWithFallback(
    async () => (await getFeaturedPublicNews(signal)).map(mapListItem),
    fallbackFeaturedNews,
  )
}

export function getNewsBySlug(slug: string, signal?: AbortSignal) {
  return resolveWithFallback(
    async () => mapDetail(await getPublicNewsBySlug(slug, signal)),
    () => news.find((item) => item.slug === slug) ?? null,
  )
}
