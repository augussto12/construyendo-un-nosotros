import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = {
  children: ReactNode
  to?: string
  href?: string
  variant?: ButtonVariant
  className?: string
  showIcon?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  'aria-label'?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-green text-brand-ink hover:bg-[#50ba63] border-brand-green shadow-sm',
  secondary:
    'bg-white text-brand-ink border-slate-200 hover:border-brand-green hover:bg-brand-mint/40',
  ghost:
    'bg-transparent text-brand-ink border-transparent hover:bg-brand-mint/50',
}

export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  className = '',
  showIcon = false,
  type = 'button',
  onClick,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const classes = `focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-5 py-3 text-sm font-semibold transition ${variantClasses[variant]} ${className}`
  const content = (
    <>
      <span>{children}</span>
      {showIcon ? <ArrowRight aria-hidden="true" size={17} strokeWidth={2.2} /> : null}
    </>
  )

  if (to) {
    return (
      <Link className={classes} to={to} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {content}
      </a>
    )
  }

  return (
    <button className={classes} type={type} onClick={onClick} aria-label={ariaLabel}>
      {content}
    </button>
  )
}
