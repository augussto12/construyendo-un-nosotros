import type { AdminNewsStatus } from '../../../api/adminNewsApi'
import type { AdminMediaAsset, AdminNewsImage } from '../../../api/adminMediaApi'
import { buildPublicAssetUrl } from '../../../api/apiClient'
import { sanitizeBasicHtml } from '../utils/htmlSanitizer'

type NewsPreviewState = {
  title: string
  excerpt: string
  contentHtml: string
  status: AdminNewsStatus
  publishedAt: string
  authorName: string
  videoUrl: string
  videoProvider: string
  seoTitle: string
  seoDescription: string
}

type NewsEditorialPreviewProps = {
  value: NewsPreviewState
  mainImage?: AdminMediaAsset | null
  gallery?: AdminNewsImage[]
}

function formatDate(value: string) {
  if (!value) {
    return 'Fecha pendiente'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Fecha pendiente'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function youtubeEmbed(url: URL) {
  if (url.hostname.includes('youtu.be')) {
    return `https://www.youtube.com/embed/${url.pathname.replace('/', '')}`
  }

  const videoId = url.searchParams.get('v')
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

function vimeoEmbed(url: URL) {
  const id = url.pathname.split('/').filter(Boolean).at(0)
  return id ? `https://player.vimeo.com/video/${id}` : null
}

function getEmbedUrl(value: string, provider: string) {
  if (!value.trim()) {
    return null
  }

  try {
    const url = new URL(value)
    if (provider === 'youtube' || url.hostname.includes('youtube') || url.hostname.includes('youtu.be')) {
      return youtubeEmbed(url)
    }
    if (provider === 'vimeo' || url.hostname.includes('vimeo')) {
      return vimeoEmbed(url)
    }
    return null
  } catch {
    return null
  }
}

function getSafeExternalUrl(value: string) {
  if (!value.trim()) {
    return null
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export default function NewsEditorialPreview({
  value,
  mainImage,
  gallery = [],
}: NewsEditorialPreviewProps) {
  const embedUrl = getEmbedUrl(value.videoUrl, value.videoProvider)
  const externalVideoUrl = getSafeExternalUrl(value.videoUrl)
  const sanitizedContent = sanitizeBasicHtml(value.contentHtml)

  return (
    <div className="grid gap-5">
      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        La vista previa es orientativa. El contenido final se sanitiza al guardar.
      </p>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
            Noticias
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-brand-ink">
            {value.title || 'Titulo de la noticia'}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {value.excerpt || 'La bajada de la noticia aparecera en este espacio.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-500">
            <span>{formatDate(value.publishedAt)}</span>
            {value.authorName ? <span>Por {value.authorName}</span> : null}
            <span>{value.status}</span>
          </div>
        </div>

        {mainImage ? (
          <figure className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img
              className="aspect-[16/9] w-full object-cover"
              src={buildPublicAssetUrl(mainImage.url)}
              alt={mainImage.altText ?? mainImage.originalFileName}
            />
          </figure>
        ) : null}

        {embedUrl ? (
          <div className="mt-6 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
            <iframe
              className="h-full w-full"
              src={embedUrl}
              title="Video de la noticia"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : externalVideoUrl ? (
          <a
            className="focus-ring mt-6 inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-mint/40"
            href={externalVideoUrl}
            target="_blank"
            rel="noreferrer"
          >
            Ver video externo
          </a>
        ) : value.videoUrl ? (
          <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            La URL de video se mostrara cuando sea valida.
          </p>
        ) : null}

        <div
          className="prose-institutional mt-8"
          dangerouslySetInnerHTML={{
            __html: sanitizedContent || '<p>El contenido de la noticia aparecera aca.</p>',
          }}
        />

        {gallery.length > 0 ? (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-semibold text-brand-ink">Galeria</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[...gallery]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((image) => (
                  <figure
                    className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                    key={image.id}
                  >
                    <img
                      className="aspect-[4/3] w-full object-cover"
                      src={buildPublicAssetUrl(image.media.url)}
                      alt={image.altText ?? image.media.altText ?? image.media.originalFileName}
                    />
                    {image.caption ? (
                      <figcaption className="px-3 py-2 text-sm text-slate-600">
                        {image.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
            </div>
          </section>
        ) : null}
      </article>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Como aparece en Google</h2>
        <p className="mt-1 text-sm text-slate-600">
          Vista simple de los textos que pueden usarse en buscadores o al compartir la noticia.
        </p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="font-semibold text-slate-700">Titulo</dt>
            <dd className="mt-1 text-slate-600">{value.seoTitle || value.title || '-'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Descripcion</dt>
            <dd className="mt-1 text-slate-600">{value.seoDescription || value.excerpt || '-'}</dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}
