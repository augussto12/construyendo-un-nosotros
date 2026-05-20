import { partners } from '../data/partners'

export default function PartnerLogoGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {partners.map((partner) => (
        <div
          className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-4 text-center"
          key={partner.id}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-ink">
            {partner.name}
          </p>
          {partner.sector ? (
            <p className="mt-2 text-xs text-slate-500">{partner.sector}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
