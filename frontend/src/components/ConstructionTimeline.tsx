import { CheckCircle2, Clock, Hammer, MapPinned } from 'lucide-react'
import { constructionStages } from '../data/construction'
import type { ConstructionStage } from '../types'

const statusLabel: Record<ConstructionStage['status'], string> = {
  presented: 'Presentado',
  completed: 'Completado',
  'in-progress': 'En avance',
  planned: 'Planificado',
}

const statusIcon = {
  presented: MapPinned,
  completed: CheckCircle2,
  'in-progress': Hammer,
  planned: Clock,
}

export default function ConstructionTimeline() {
  return (
    <div className="relative">
      <div className="absolute left-5 top-0 hidden h-full w-px bg-slate-200 md:block" />
      <div className="grid gap-6">
        {constructionStages.map((stage) => {
          const Icon = statusIcon[stage.status]

          return (
            <article className="relative grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:ml-14" key={stage.id}>
              <div className="absolute -left-[3.25rem] top-6 hidden h-10 w-10 items-center justify-center rounded-full border border-brand-green bg-white text-[#428f4f] md:flex">
                <Icon aria-hidden="true" size={19} />
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#428f4f]">
                    {stage.period}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-brand-ink">{stage.title}</h3>
                </div>
                <span className="rounded-md bg-brand-mint px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink">
                  {statusLabel[stage.status]}
                </span>
              </div>
              <p className="text-base leading-7 text-slate-700">{stage.description}</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {stage.items.map((item) => (
                  <li className="flex gap-3 text-sm leading-6 text-slate-600" key={item}>
                    <CheckCircle2 className="mt-1 shrink-0 text-[#428f4f]" aria-hidden="true" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </div>
  )
}
