import { Link } from 'react-router-dom'
import type { NewsItem } from '../types'
import Card from './Card'

type NewsCardProps = {
  item: NewsItem
}

export default function NewsCard({ item }: NewsCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden">
      <Link to={`/noticias/${item.slug}`} className="focus-ring block">
        <div className="aspect-[16/10] bg-brand-paper">
          {item.imageUrl ? (
            <img
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              src={item.imageUrl}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
              Sin imagen destacada
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
          <span>{item.category}</span>
          {item.dateLabel ? <span className="text-slate-400">{item.dateLabel}</span> : null}
        </div>
        <h3 className="text-xl font-semibold leading-snug text-brand-ink">
          <Link className="focus-ring rounded-sm hover:text-[#428f4f]" to={`/noticias/${item.slug}`}>
            {item.title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{item.excerpt}</p>
        {item.isTodo ? (
          <p className="mt-5 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            Contenido editorial pendiente de completar.
          </p>
        ) : null}
      </div>
    </Card>
  )
}
