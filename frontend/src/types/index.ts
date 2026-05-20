export type NavItem = {
  label: string
  href: string
}

export type NewsItem = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  dateLabel?: string
  imageUrl?: string
  sourceUrl?: string
  contentHtml?: string
  content: string[]
  isTodo?: boolean
  status?: NewsStatus
  publishedAt?: string
  scheduledAt?: string
  authorName?: string
  video?: VideoEmbedInfo
  tags?: PublicNewsTagDto[]
  gallery?: PublicNewsImageDto[]
  seoTitle?: string
  seoDescription?: string
  ogImage?: PublicMediaAssetDto
  isFeatured?: boolean
  featuredOrder?: number
}

export type NewsStatus =
  | 'draft'
  | 'published'
  | 'scheduled'
  | 'unpublished'
  | 'expired'
  | 'archived'

export type VideoProvider = 'youtube' | 'vimeo' | 'external'

export type VideoEmbedInfo = {
  url: string
  provider: VideoProvider
  title?: string
}

export type PublicMediaAssetDto = {
  id: string
  url: string
  altText?: string
  width?: number
  height?: number
  mimeType?: string
}

export type PublicNewsImageDto = PublicMediaAssetDto & {
  imageId: string
  caption?: string
  sortOrder: number
}

export type PublicNewsCategoryDto = {
  id: string
  name: string
  slug: string
  description?: string
}

export type PublicNewsTagDto = {
  id: string
  name: string
  slug: string
}

export type PublicNewsListItemDto = {
  id: string
  slug: string
  title: string
  excerpt: string
  category?: PublicNewsCategoryDto
  tags?: PublicNewsTagDto[]
  publishedAt?: string
  dateLabel?: string
  mainImage?: PublicMediaAssetDto
  video?: VideoEmbedInfo
  isFeatured?: boolean
  featuredOrder?: number
  seoTitle?: string
  seoDescription?: string
  ogImage?: PublicMediaAssetDto
}

export type PublicNewsDetailDto = PublicNewsListItemDto & {
  contentHtml?: string
  content?: string[]
  gallery?: PublicNewsImageDto[]
  sourceUrl?: string
  authorName?: string
  status?: NewsStatus
  scheduledAt?: string
}

export type PublicPagedResultDto<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type PublicSiteSettingDto = {
  key: string
  value: string
  type: 'text' | 'url' | 'email' | 'phone' | 'json'
}

export type Partner = {
  id: string
  name: string
  sector?: string
  website?: string
}

export type ConstructionStage = {
  id: string
  title: string
  period: string
  status: 'presented' | 'completed' | 'in-progress' | 'planned'
  description: string
  items: string[]
  imageUrl?: string
}

export type SocialLink = {
  label: string
  href: string
  kind: 'instagram' | 'twitter' | 'external'
}

export type ContactInfo = {
  address: string
  email: string
  phone: string
  city: string
  social: SocialLink[]
}
