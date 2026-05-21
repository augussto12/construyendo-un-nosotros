import { Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { ApiError, buildPublicAssetUrl } from '../../../api/apiClient'
import {
  deleteMedia,
  getMedia,
  uploadMedia,
  type AdminMediaAsset,
} from '../../../api/adminMediaApi'
import AdminDialog from './AdminDialog'

const maxImageBytes = 5 * 1024 * 1024
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

type MediaManagerPanelProps = {
  title?: string
  description?: string
  selectable?: boolean
  selectedId?: string | null
  compact?: boolean
  onSelect?: (asset: AdminMediaAsset) => void
  onDeleted?: (assetId: string) => void
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function validateFile(file: File | null) {
  if (!file) {
    return 'Selecciona una imagen.'
  }

  if (!allowedTypes.includes(file.type)) {
    return 'Formato no permitido. Usa jpg, jpeg, png o webp.'
  }

  if (file.size > maxImageBytes) {
    return 'La imagen no puede superar 5 MB.'
  }

  return null
}

export default function MediaManagerPanel({
  title = 'Media',
  description = 'Biblioteca de imagenes del backoffice.',
  selectable = false,
  selectedId = null,
  compact = false,
  onSelect,
  onDeleted,
}: MediaManagerPanelProps) {
  const [items, setItems] = useState<AdminMediaAsset[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminMediaAsset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fileError = useMemo(() => validateFile(file), [file])

  useEffect(() => {
    const controller = new AbortController()

    async function loadMedia() {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getMedia(undefined, controller.signal)
        setItems(result)
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }

        setError(loadError instanceof ApiError && loadError.status === 401
          ? 'Sesion expirada. Vuelve a iniciar sesion.'
          : 'No pudimos cargar la biblioteca de imagenes.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadMedia()

    return () => controller.abort()
  }, [])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSuccess(null)
    setError(null)
    setFile(event.target.files?.[0] ?? null)
  }

  async function handleUpload() {
    const validation = validateFile(file)
    if (validation) {
      setError(validation)
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      setSuccess(null)
      const response = await uploadMedia(file!, altText)
      setItems((current) => [response.media, ...current])
      setFile(null)
      setAltText('')
      setSuccess('Imagen subida correctamente.')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No pudimos subir la imagen.')
    } finally {
      setIsUploading(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return
    }

    try {
      setDeletingId(pendingDelete.id)
      setError(null)
      await deleteMedia(pendingDelete.id)
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id))
      onDeleted?.(pendingDelete.id)
      setPendingDelete(null)
      setSuccess('Imagen archivada correctamente.')
    } catch (deleteError) {
      setError(deleteError instanceof ApiError && deleteError.status === 401
        ? 'Sesion expirada. Vuelve a iniciar sesion.'
        : deleteError instanceof Error ? deleteError.message : 'No pudimos archivar la imagen.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className={`grid gap-5 ${compact ? '' : 'mx-auto max-w-6xl'}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
          Biblioteca
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <Upload aria-hidden="true" size={18} />
          Subir imagen
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span className="inline-flex items-baseline gap-1">
              Archivo <span className="text-red-600">*</span>
            </span>
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <span className="text-xs font-normal text-slate-500">
              Imagen para noticias, principal o galeria.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Texto alternativo
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              maxLength={250}
              disabled={isUploading}
            />
            <span className="text-xs font-normal text-slate-500">
              Describe la imagen para accesibilidad y SEO.
            </span>
          </label>
          <button
            className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brand-green bg-brand-green px-5 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
            type="button"
            onClick={handleUpload}
            disabled={isUploading || Boolean(fileError)}
          >
            {isUploading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
        <p className={`text-sm ${fileError && file ? 'text-amber-700' : 'text-slate-500'}`}>
          {fileError && file ? fileError : 'JPG, PNG o WebP. Maximo 5 MB.'}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">Imagenes</h2>
          <span className="text-sm text-slate-500">{items.length} archivo(s)</span>
        </div>

        {isLoading ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Cargando imagenes...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Todavia no hay imagenes cargadas.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const isSelected = selectedId === item.id
              return (
                <article
                  className={`overflow-hidden rounded-lg border bg-white shadow-sm ${
                    isSelected ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-slate-200'
                  }`}
                  key={item.id}
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    <img
                      className="h-full w-full object-cover"
                      src={buildPublicAssetUrl(item.url)}
                      alt={item.altText ?? item.originalFileName}
                      loading="lazy"
                    />
                  </div>
                  <div className="grid gap-3 p-4">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-950">
                        {item.originalFileName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatBytes(item.sizeBytes)} - {item.extension.replace('.', '').toUpperCase()}
                      </p>
                      {item.altText ? (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                          Alt: {item.altText}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-2 sm:flex sm:flex-row">
                      {selectable ? (
                        <button
                          className="focus-ring inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-brand-green bg-brand-green px-3 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63]"
                          type="button"
                          onClick={() => onSelect?.(item)}
                        >
                          {isSelected ? 'Seleccionada' : 'Seleccionar'}
                        </button>
                      ) : null}
                      <button
                        className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        disabled={deletingId === item.id}
                      >
                        <Trash2 aria-hidden="true" size={16} />
                        Archivar
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {pendingDelete ? (
        <AdminDialog
          title="Archivar imagen"
          description={`La imagen "${pendingDelete.originalFileName}" dejara de aparecer en la biblioteca. No se borra fisicamente el archivo.`}
          confirmLabel="Archivar"
          tone="danger"
          isSubmitting={deletingId === pendingDelete.id}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </section>
  )
}
