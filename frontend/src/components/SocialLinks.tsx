import { Camera, ExternalLink, MessageCircle } from 'lucide-react'
import type { SocialLink } from '../types'

type SocialLinksProps = {
  links: SocialLink[]
  inverted?: boolean
}

export default function SocialLinks({ links, inverted = false }: SocialLinksProps) {
  return (
    <ul className="flex flex-wrap gap-3">
      {links.map((link) => {
        const Icon =
          link.kind === 'instagram'
            ? Camera
            : link.kind === 'twitter'
              ? MessageCircle
              : ExternalLink

        return (
          <li key={link.label}>
            <a
              className={`focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border transition ${
                inverted
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-slate-200 text-brand-ink hover:border-brand-green hover:bg-brand-mint/50'
              }`}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              title={link.label}
            >
              <Icon aria-hidden="true" size={20} />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
