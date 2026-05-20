import Button from '../components/Button'
import ContactInfo from '../components/ContactInfo'
import PageHeader from '../components/PageHeader'
import Seo from '../components/Seo'
import { DONATION_URL } from '../data/site'

export default function ContactPage() {
  return (
    <>
      <Seo
        title="Contacto"
        description="Datos de contacto de Construyendo Un Nosotros en Mar del Plata."
      />
      <PageHeader
        eyebrow="Contacto"
        title="Hablemos del proyecto"
        description="Canales actuales detectados en la web institucional. El formulario queda como placeholder para integrar con backend .NET."
      />
      <section className="py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <ContactInfo />
          <form className="rounded-lg border border-slate-200 bg-brand-paper p-6 sm:p-8">
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-medium text-brand-ink">
                Nombre
                <input className="focus-ring rounded-md border border-slate-200 bg-white px-4 py-3 text-base" placeholder="TODO: conectar formulario" type="text" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-brand-ink">
                Email
                <input className="focus-ring rounded-md border border-slate-200 bg-white px-4 py-3 text-base" placeholder="nombre@email.com" type="email" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-brand-ink">
                Mensaje
                <textarea className="focus-ring min-h-36 rounded-md border border-slate-200 bg-white px-4 py-3 text-base" placeholder="Escribi tu consulta" />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary">
                  Enviar consulta
                </Button>
                <Button href={DONATION_URL}>Donar</Button>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                TODO: este formulario no envia datos todavia. Queda preparado para conectarse a un endpoint .NET.
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
