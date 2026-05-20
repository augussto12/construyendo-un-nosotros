import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <article
      className={`rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-soft ${className}`}
    >
      {children}
    </article>
  )
}
