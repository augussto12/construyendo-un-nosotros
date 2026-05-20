import PartnerLogoGrid from '../components/PartnerLogoGrid'
import SectionTitle from '../components/SectionTitle'
import { media } from '../data/site'

export default function PartnersSection() {
  return (
    <section className="bg-brand-paper py-14 sm:py-20">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionTitle
            eyebrow="Empresas colaboradoras"
            title="Empresas que forman parte"
            description="El sitio actual muestra un agradecimiento colectivo a las empresas y organizaciones que acompanaron el proyecto. Los logos individuales quedan mockeados para reemplazarse por assets oficiales."
          />
          <div className="grid gap-5">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img className="w-full object-cover" src={media.partners} alt="Agradecimiento a empresas colaboradoras" loading="lazy" />
            </div>
            <PartnerLogoGrid />
          </div>
        </div>
      </div>
    </section>
  )
}
