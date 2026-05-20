import Button from '../components/Button'
import { DONATION_URL, SOLIDARITY_FORM_URL, media } from '../data/site'

export default function DonationCTA() {
  return (
    <section className="bg-brand-ink text-white">
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">
            Cadena de Valor Solidaria
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Sumate con recursos, tiempo, ideas o acompanamiento.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/74">
            El sitio actual invita a donar y participar de la cadena solidaria. Este bloque queda listo para conectar formas de donacion, campanas y formularios administrables.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href={DONATION_URL}>Donar ahora</Button>
            <Button href={SOLIDARITY_FORM_URL} variant="secondary">
              Formulario solidario
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/12">
          <img className="aspect-[4/3] h-full w-full object-cover" src={media.solidarity} alt="" loading="lazy" />
        </div>
      </div>
    </section>
  )
}
