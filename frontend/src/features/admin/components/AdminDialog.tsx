import type { ReactNode } from 'react'

type AdminDialogProps = {
  title: string
  description?: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  isSubmitting?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function AdminDialog({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'default',
  isSubmitting = false,
  onCancel,
  onConfirm,
}: AdminDialogProps) {
  const confirmClass =
    tone === 'danger'
      ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
      : 'border-brand-green bg-brand-green text-brand-ink hover:bg-[#50ba63]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
        {children ? <div className="mt-5">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            className={`focus-ring inline-flex min-h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${confirmClass}`}
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
