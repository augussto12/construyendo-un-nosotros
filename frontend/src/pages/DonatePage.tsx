import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import Seo from '../components/Seo'
import { DONATION_URL, SOLIDARITY_FORM_URL } from '../data/site'

export default function DonatePage() {
  return (
    <>
      <Seo
        title="Donar"
        description="Opciones temporales para donar y sumarse a la cadena de valor solidaria."
      />
      <PageHeader
        eyebrow="Donar"
        title="Sumate a la Cadena de Valor Solidaria"
        description="Por ahora los botones apuntan a los formularios externos detectados en el sitio actual. La pantalla queda lista para integrar medios de pago o campanas administrables."
      />
      <section className="py-14 sm:py-20">
        <div className="container-page grid gap-5 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-semibold text-brand-ink">Donacion directa</h2>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Link temporal tomado del boton Donar de la web actual.
            </p>
            <div className="mt-6">
              <Button href={DONATION_URL}>Abrir formulario de donacion</Button>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-brand-paper p-7 shadow-sm">
            <h2 className="text-2xl font-semibold text-brand-ink">Cadena solidaria</h2>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Formulario externo asociado al bloque "Sumate a la Cadena de Valor Solidario".
            </p>
            <div className="mt-6">
              <Button href={SOLIDARITY_FORM_URL} variant="secondary">
                Sumarse al formulario
              </Button>
            </div>
          </article>
        </div>
      </section>
    </>
  )
}
