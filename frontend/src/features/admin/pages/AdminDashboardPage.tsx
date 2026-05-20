export default function AdminDashboardPage() {
  return (
    <section className="mx-auto max-w-6xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
          Dashboard
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Panel de administracion</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Backoffice V1 listo para gestionar noticias, media, settings y usuarios
          segun el rol de la sesion.
        </p>
      </div>
    </section>
  )
}
