import type { AdminMediaAsset } from '../../../api/adminMediaApi'
import MediaManagerPanel from './MediaManagerPanel'

type MediaPickerDialogProps = {
  title: string
  description?: string
  selectedId?: string | null
  onSelect: (asset: AdminMediaAsset) => void
  onClose: () => void
}

export default function MediaPickerDialog({
  title,
  description,
  selectedId,
  onSelect,
  onClose,
}: MediaPickerDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-3 py-4 sm:px-4 sm:py-6">
      <section className="w-full max-w-5xl rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-xl sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            ) : null}
          </div>
          <button
            className="focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            type="button"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
        <MediaManagerPanel
          title="Seleccionar imagen"
          description="Puedes elegir una imagen existente o subir una nueva."
          compact
          selectable
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </section>
    </div>
  )
}
