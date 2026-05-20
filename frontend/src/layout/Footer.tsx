import { Link } from 'react-router-dom'
import SocialLinks from '../components/SocialLinks'
import { contactInfo } from '../data/contact'
import { DONATION_URL, navItems, SITE_NAME } from '../data/site'

export default function Footer() {
  return (
    <footer className="bg-brand-ink text-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_1fr] lg:py-16">
        <div>
          <p className="text-xl font-semibold">{SITE_NAME}</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/72">
            Programa impulsado junto a Fundacion PUPI para construir una cadena de valor solidaria en Mar del Plata - Batan.
          </p>
          <a
            className="focus-ring mt-6 inline-flex rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63]"
            href={DONATION_URL}
            target="_blank"
            rel="noreferrer"
          >
            Donar
          </a>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
            Menu
          </h2>
          <ul className="mt-4 grid gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link className="focus-ring rounded-sm text-sm text-white/78 hover:text-white" to={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
            Informacion
          </h2>
          <address className="mt-4 grid gap-3 text-sm not-italic leading-6 text-white/78">
            <span>{contactInfo.address}</span>
            <a className="focus-ring rounded-sm hover:text-white" href={`mailto:${contactInfo.email}`}>
              {contactInfo.email}
            </a>
            <a className="focus-ring rounded-sm hover:text-white" href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}>
              {contactInfo.phone}
            </a>
          </address>
          <div className="mt-6">
            <SocialLinks links={contactInfo.social} inverted />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-5 text-xs text-white/55">
          Frontend institucional preparado para integrarse con API y backoffice.
        </div>
      </div>
    </footer>
  )
}
