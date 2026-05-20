import { useEffect, useState } from 'react'
import NewsCard from '../components/NewsCard'
import PageHeader from '../components/PageHeader'
import Seo from '../components/Seo'
import { getNews } from '../services/newsService'
import type { NewsItem } from '../types'

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadNews() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        setItems(await getNews(controller.signal))
      } catch {
        setErrorMessage('No pudimos cargar las noticias en este momento.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadNews()

    return () => controller.abort()
  }, [])

  return (
    <>
      <Seo
        title="Noticias"
        description="Noticias y novedades del programa Construyendo Un Nosotros."
      />
      <PageHeader
        eyebrow="Noticias"
        title="Novedades del proyecto"
        description="Noticias y novedades publicadas por la fundacion."
      />
      <section className="py-14 sm:py-20">
        {isLoading ? (
          <div className="container-page">
            <p className="rounded-lg border border-slate-200 bg-brand-paper p-6 text-slate-700">
              Cargando noticias...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="container-page">
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
              {errorMessage}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="container-page">
            <p className="rounded-lg border border-slate-200 bg-brand-paper p-6 text-slate-700">
              Todavia no hay noticias publicadas.
            </p>
          </div>
        ) : (
          <div className="container-page grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <NewsCard item={item} key={item.id} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
