type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export default function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="bg-brand-paper">
      <div className="container-page py-14 sm:py-20">
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#428f4f]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">{description}</p>
        ) : null}
      </div>
    </header>
  )
}
