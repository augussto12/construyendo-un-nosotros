import { useSearchParams } from 'react-router-dom'
import ConstructionTimeline from '../components/ConstructionTimeline'
import PageHeader from '../components/PageHeader'
import Seo from '../components/Seo'
import { backgroundContent, projectImageUrl, projectSections } from '../data/about'
import { media } from '../data/site'

type AntecedentesTab = 'fundamentacion' | 'construccion'

function makeSectionId(value: string) {
  return value.toLowerCase().replace(/[¿?]/g, '').replace(/\s+/g, '-')
}

export default function AntecedentesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: AntecedentesTab =
    searchParams.get('tab') === 'construccion' ? 'construccion' : 'fundamentacion'

  const selectTab = (tab: AntecedentesTab) => {
    setSearchParams(tab === 'construccion' ? { tab: 'construccion' } : {}, {
      replace: true,
    })
  }

  const navigation = [
    ...backgroundContent.map((section) => section.title),
    ...projectSections.map((section) => section.title),
  ]

  return (
    <>
      <Seo
        title="Antecedentes"
        description="Antecedentes, fundamentacion y etapa constructiva del programa Construyendo Un Nosotros."
      />
      <PageHeader
        eyebrow="Antecedentes"
        title="El origen, la fundamentacion y la obra"
        description="La historia institucional y la etapa constructiva del Complejo Deportivo, Social y Cultural Mar del Plata - Batan reunidas en una misma seccion."
      />
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-5">
          <div
            className="grid rounded-lg border border-brand-green/35 bg-brand-mint p-1 shadow-sm sm:inline-grid sm:grid-cols-2"
            role="tablist"
            aria-label="Contenido de antecedentes"
          >
            <button
              className={`focus-ring rounded-md px-5 py-3 text-sm font-semibold transition ${
                activeTab === 'fundamentacion'
                  ? 'bg-brand-green text-brand-ink shadow-sm'
                  : 'text-brand-ink/70 hover:bg-white/70 hover:text-brand-ink'
              }`}
              type="button"
              role="tab"
              aria-selected={activeTab === 'fundamentacion'}
              onClick={() => selectTab('fundamentacion')}
            >
              Fundamentacion
            </button>
            <button
              className={`focus-ring rounded-md px-5 py-3 text-sm font-semibold transition ${
                activeTab === 'construccion'
                  ? 'bg-brand-green text-brand-ink shadow-sm'
                  : 'text-brand-ink/70 hover:bg-white/70 hover:text-brand-ink'
              }`}
              type="button"
              role="tab"
              aria-selected={activeTab === 'construccion'}
              onClick={() => selectTab('construccion')}
            >
              Etapa constructiva
            </button>
          </div>
        </div>
      </section>
      {activeTab === 'fundamentacion' ? (
        <section className="py-14 sm:py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <aside className="rounded-lg border border-slate-200 bg-brand-paper p-6 lg:sticky lg:top-28">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#428f4f]">
                Proyecto
              </p>
              <p className="mt-4 text-2xl font-semibold leading-snug text-brand-ink">
                Deportivo, Social y Cultural Mar del Plata - Batan
              </p>
              <nav className="mt-6" aria-label="Secciones de antecedentes">
                <ul className="grid gap-2">
                  {navigation.map((item) => (
                    <li key={item}>
                      <a
                        className="focus-ring block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:text-brand-ink"
                        href={`#${makeSectionId(item)}`}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
            <div className="grid gap-12">
              {backgroundContent.map((section) => (
                <article
                  className="scroll-mt-28"
                  id={makeSectionId(section.title)}
                  key={section.title}
                >
                  <h2 className="text-2xl font-semibold text-brand-ink">{section.title}</h2>
                  <div className="prose-institutional mt-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
              <section className="scroll-mt-28 rounded-lg border border-slate-200 bg-brand-paper p-5 sm:p-7">
                <img
                  className="aspect-[16/9] w-full rounded-md object-cover"
                  src={projectImageUrl}
                  alt="Ninos, ninas y adolescentes reunidos en una cancha del proyecto Construyendo Un Nosotros"
                />
                <h2 className="mt-7 text-3xl font-semibold leading-tight text-brand-ink">
                  Proyecto Social de Inclusion mediante el deporte y la cultura:
                  “Construyendo Un Nosotros”
                </h2>
              </section>
              {projectSections.map((section) => (
                <article
                  className="scroll-mt-28 border-t border-slate-200 pt-10"
                  id={makeSectionId(section.title)}
                  key={section.title}
                >
                  <h2 className="text-2xl font-semibold text-brand-ink">{section.title}</h2>
                  <div className="prose-institutional mt-4">
                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.listIntro ? (
                      <p className="font-semibold text-brand-ink">{section.listIntro}</p>
                    ) : null}
                    {section.bullets ? (
                      <ul className="mt-5 grid gap-3">
                        {section.bullets.map((bullet) => (
                          <li
                            className="rounded-md border border-slate-200 bg-white p-4 text-base leading-7 text-slate-700"
                            key={bullet}
                          >
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-14 sm:py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="grid gap-5 self-start">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-brand-paper">
                <img
                  className="aspect-[4/3] w-full object-cover"
                  src={media.solidarity}
                  alt=""
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-brand-paper p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#428f4f]">
                  Galeria
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  TODO: reemplazar por galeria de imagenes y videos con assets reales, ordenados por etapa de obra.
                </p>
              </div>
            </div>
            <ConstructionTimeline />
          </div>
        </section>
      )}
    </>
  )
}
