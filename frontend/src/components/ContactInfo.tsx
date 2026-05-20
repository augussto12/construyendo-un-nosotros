import { Mail, MapPin, Phone } from 'lucide-react'
import { contactInfo } from '../data/contact'
import SocialLinks from './SocialLinks'

export default function ContactInfo() {
  return (
    <div className="grid gap-4">
      <a
        className="focus-ring flex gap-4 rounded-lg border border-slate-200 bg-white p-5 text-slate-700"
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          contactInfo.address,
        )}`}
        target="_blank"
        rel="noreferrer"
      >
        <MapPin className="mt-1 text-[#428f4f]" aria-hidden="true" />
        <span>{contactInfo.address}</span>
      </a>
      <a
        className="focus-ring flex gap-4 rounded-lg border border-slate-200 bg-white p-5 text-slate-700"
        href={`mailto:${contactInfo.email}`}
      >
        <Mail className="mt-1 text-[#428f4f]" aria-hidden="true" />
        <span>{contactInfo.email}</span>
      </a>
      <a
        className="focus-ring flex gap-4 rounded-lg border border-slate-200 bg-white p-5 text-slate-700"
        href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
      >
        <Phone className="mt-1 text-[#428f4f]" aria-hidden="true" />
        <span>{contactInfo.phone}</span>
      </a>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Seguinos
        </p>
        <SocialLinks links={contactInfo.social} />
      </div>
    </div>
  )
}
