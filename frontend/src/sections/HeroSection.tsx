import Button from '../components/Button'
import { DONATION_URL, media } from '../data/site'

export default function HeroSection() {
  return (
    <section className="bg-white">
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-16">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#428f4f]">
            Fundacion PUPI
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">
            Construyendo Un Nosotros en Mar del Plata - Batan
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            Un programa de articulacion social, deportiva y cultural que convoca a personas, instituciones y empresas a sostener una cadena de valor solidaria.
          </p>
          <blockquote className="mt-7 border-l-4 border-brand-green pl-5 font-serif text-xl leading-8 text-brand-ink">
            "No hay nadie tan fuerte que pueda hacerlo solo, ni nadie tan debil que no pueda ayudar"
          </blockquote>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={DONATION_URL}>Donar</Button>
            <Button to="/antecedentes" variant="secondary" showIcon>
              Conocer el proyecto
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-brand-paper shadow-soft">
          <video
            className="aspect-[4/3] h-full w-full object-cover"
            src={media.heroVideo}
            poster={media.heroPoster}
            autoPlay
            muted
            loop
            playsInline
            aria-label="Video institucional del proyecto"
          />
        </div>
      </div>
    </section>
  )
}
