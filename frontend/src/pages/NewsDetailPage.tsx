import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import Seo from '../components/Seo'
import { getNewsBySlug } from '../services/newsService'
import type { NewsItem } from '../types'

function youtubeEmbed(url: URL) {
  if (url.hostname.includes('youtu.be')) {
    const id = url.pathname.split('/').filter(Boolean).at(0)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }

  const videoId = url.searchParams.get('v')
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

function vimeoEmbed(url: URL) {
  const id = url.pathname.split('/').filter(Boolean).at(0)
  return id ? `https://player.vimeo.com/video/${id}` : null
}

function getVideoEmbedUrl(item: NewsItem) {
  if (!item.video?.url.trim()) {
    return null
  }

  try {
    const url = new URL(item.video.url)
    if (item.video.provider === 'youtube' || url.hostname.includes('youtube') || url.hostname.includes('youtu.be')) {
      return youtubeEmbed(url)
    }
    if (item.video.provider === 'vimeo' || url.hostname.includes('vimeo')) {
      return vimeoEmbed(url)
    }
    return null
  } catch {
    return null
  }
}

function getSafeVideoUrl(item: NewsItem) {
  if (!item.video?.url.trim()) {
    return null
  }

  try {
    const url = new URL(item.video.url)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export default function NewsDetailPage() {
  const { slug } = useParams()
  const [item, setItem] = useState<NewsItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadNewsDetail() {
      if (!slug) {
        setItem(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage(null)
        setItem(await getNewsBySlug(slug, controller.signal))
      } catch {
        setErrorMessage('No pudimos cargar la noticia en este momento.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadNewsDetail()

    return () => controller.abort()
  }, [slug])

  if (isLoading) {
    return (
      <>
        <Seo title="Cargando noticia" description="Cargando noticia." />
        <PageHeader title="Cargando noticia" />
        <section className="container-page py-14">
          <p className="rounded-lg border border-slate-200 bg-brand-paper p-6 text-slate-700">
            Cargando noticia...
          </p>
        </section>
      </>
    )
  }

  if (errorMessage) {
    return (
      <>
        <Seo title="Error al cargar noticia" description="No pudimos cargar la noticia." />
        <PageHeader title="No pudimos cargar la noticia" />
        <section className="container-page py-14">
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
            {errorMessage}
          </p>
        </section>
      </>
    )
  }

  if (!item) {
    return (
      <>
        <Seo title="Noticia no encontrada" description="La noticia solicitada no existe." />
        <PageHeader title="Noticia no encontrada" />
        <section className="container-page py-14">
          <Button to="/noticias" variant="secondary">
            Volver a noticias
          </Button>
        </section>
      </>
    )
  }

  const videoEmbedUrl = getVideoEmbedUrl(item)
  const externalVideoUrl = getSafeVideoUrl(item)

  return (
    <>
      <Seo
        title={item.seoTitle ?? item.title}
        description={item.seoDescription ?? item.excerpt}
        image={item.ogImage?.url ?? item.imageUrl}
      />
      <PageHeader eyebrow={item.category} title={item.title} description={item.excerpt} />
      <article className="py-14 sm:py-20">
        <div className="container-page max-w-4xl">
          {item.imageUrl ? (
            <img
              className="mb-9 aspect-[16/9] w-full rounded-lg border border-slate-200 object-cover"
              src={item.imageUrl}
              alt=""
            />
          ) : null}
          <div className="prose-institutional">
            {item.dateLabel ? <p className="font-semibold text-[#428f4f]">{item.dateLabel}</p> : null}
            {item.contentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
            ) : (
              item.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))
            )}
          </div>
          {videoEmbedUrl ? (
            <div className="mt-10 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
              <iframe
                className="h-full w-full"
                src={videoEmbedUrl}
                title={item.video?.title ?? `Video de ${item.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : externalVideoUrl ? (
            <a
              className="focus-ring mt-10 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-brand-ink transition hover:border-brand-green hover:bg-brand-mint/40"
              href={externalVideoUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>Ver video externo</span>
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          ) : null}
          {item.gallery && item.gallery.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {item.gallery.map((image) => (
                <figure key={image.imageId} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img
                    className="aspect-[16/10] w-full object-cover"
                    src={image.url}
                    alt={image.altText ?? ''}
                    loading="lazy"
                  />
                  {image.caption ? (
                    <figcaption className="px-4 py-3 text-sm text-slate-600">
                      {image.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : null}
          <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row">
            <Button to="/noticias" variant="secondary">
              Volver a noticias
            </Button>
            {item.sourceUrl ? (
              <a
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-brand-ink transition hover:border-brand-green hover:bg-brand-mint/40"
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>Ver fuente actual</span>
                <ExternalLink aria-hidden="true" size={16} />
              </a>
            ) : null}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            <Link className="focus-ring rounded-sm underline decoration-slate-300 underline-offset-4 hover:text-brand-ink" to="/contacto">
              Contactar a la fundacion
            </Link>{' '}
            para enviar material o correcciones editoriales.
          </p>
        </div>
      </article>
    </>
  )
}
