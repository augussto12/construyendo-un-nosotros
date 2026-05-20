import Button from '../components/Button'
import SectionTitle from '../components/SectionTitle'
import Seo from '../components/Seo'
import { aboutIntro } from '../data/about'
import DonationCTA from '../sections/DonationCTA'
import HeroSection from '../sections/HeroSection'
import LatestNewsStrip from '../sections/LatestNewsStrip'
import PartnersSection from '../sections/PartnersSection'

export default function HomePage() {
  return (
    <>
      <Seo
        title="Construyendo Un Nosotros"
        description="Frontend institucional de Construyendo Un Nosotros, programa de Fundacion PUPI en Mar del Plata - Batan."
      />
      <LatestNewsStrip />
      <HeroSection />
      <section className="border-y border-slate-200 bg-brand-paper py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionTitle
            eyebrow="Antecedentes"
            title="Una red de trabajo social, deportivo y cultural"
          />
          <div className="prose-institutional">
            {aboutIntro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="mt-7">
              <Button to="/antecedentes" variant="secondary" showIcon>
                Leer antecedentes
              </Button>
            </div>
          </div>
        </div>
      </section>
      <DonationCTA />
      <PartnersSection />
    </>
  )
}
