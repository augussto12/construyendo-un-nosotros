type AdminPlaceholderPageProps = {
  title: string
  description: string
}

export default function AdminPlaceholderPage({
  title,
  description,
}: AdminPlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-6xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
          Proxima fase
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </section>
  )
}
