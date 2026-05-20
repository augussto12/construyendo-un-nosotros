import { apiGet } from './apiClient'
import type { PublicSiteSettingDto } from '../types'

export function getPublicSiteSettings(signal?: AbortSignal) {
  return apiGet<PublicSiteSettingDto[]>('/public/site-settings', signal)
}
