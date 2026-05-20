import { useEffect } from 'react'
import { SITE_NAME } from '../data/site'

type SeoProps = {
  title: string
  description: string
  image?: string
}

export default function Seo({ title, description, image }: SeoProps) {
  useEffect(() => {
    document.title = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`

    const metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    metaDescription?.setAttribute('content', description)

    if (image) {
      let ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
      if (!ogImage) {
        ogImage = document.createElement('meta')
        ogImage.setAttribute('property', 'og:image')
        document.head.appendChild(ogImage)
      }
      ogImage.setAttribute('content', image)
    }
  }, [description, image, title])

  return null
}
