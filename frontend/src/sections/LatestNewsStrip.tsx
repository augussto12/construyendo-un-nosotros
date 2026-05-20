import { ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedNews } from '../services/newsService'
import type { NewsItem } from '../types'

const categoryStyles: Record<string, string> = {
  Institucional: 'bg-brand-green text-brand-ink',
  Comunidad: 'bg-sky-200 text-slate-950',
  Alianzas: 'bg-amber-200 text-slate-950',
  'Etapa Constructiva': 'bg-white text-brand-ink',
}

function categoryClass(item: NewsItem) {
  return categoryStyles[item.category] ?? 'bg-brand-sage text-brand-ink'
}

export default function LatestNewsStrip() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFeaturedNews() {
      try {
        setIsLoading(true)
        setHasError(false)
        setItems(await getFeaturedNews(controller.signal))
      } catch {
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFeaturedNews()

    return () => controller.abort()
  }, [])

  const [featured, secondary] = items

  if (!isLoading && (!featured || hasError)) {
    return null
  }

  return (
    <section className="border-y border-brand-green/45 bg-brand-ink text-white shadow-[inset_0_1px_0_rgba(94,203,111,0.22),inset_0_-1px_0_rgba(94,203,111,0.18)]">
      <div className="container-page">
        <div className="-mx-4 flex min-h-12 gap-2 overflow-x-auto px-4 py-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          <Link
            className="focus-ring group inline-flex w-max max-w-[85vw] shrink-0 items-center gap-3 rounded-md border border-brand-green/35 bg-white/6 px-2 py-1 text-sm transition hover:border-brand-green/70 hover:bg-white/10 sm:max-w-[34rem]"
            to={featured ? `/noticias/${featured.slug}` : '/noticias'}
          >
            <span className="shrink-0 rounded-md bg-brand-green px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink">
              Ultima noticia
            </span>
            <span className="max-w-[13rem] truncate text-white/88 group-hover:text-white sm:max-w-[22rem]">
              {featured ? featured.title : 'Cargando noticias...'}
            </span>
            <ArrowUpRight
              className="hidden shrink-0 text-brand-green sm:block"
              aria-hidden="true"
              size={16}
            />
          </Link>
          {secondary ? (
            <Link
              className="focus-ring group inline-flex w-max max-w-[82vw] shrink-0 items-center gap-2 rounded-md border border-brand-green/25 bg-white/4 px-2.5 py-1.5 transition hover:border-brand-green/60 hover:bg-white/10 sm:max-w-[36rem]"
              to={`/noticias/${secondary.slug}`}
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryClass(secondary).split(' ')[0]}`}
                aria-hidden="true"
              />
              <span className="max-w-[16rem] truncate text-xs font-medium text-white/68 group-hover:text-white sm:max-w-[30rem]">
                {secondary.title}
              </span>
            </Link>
          ) : null}
          <Link
            className="focus-ring inline-flex shrink-0 items-center rounded-md border border-brand-green/25 px-3 py-1.5 text-xs font-semibold text-brand-green hover:border-brand-green/60 hover:text-white"
            to="/noticias"
          >
            Ver todas
          </Link>
        </div>
      </div>
    </section>
  )
}
