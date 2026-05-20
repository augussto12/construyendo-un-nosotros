import { ArrowDown, ArrowUp, ImagePlus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ApiError, buildPublicAssetUrl } from '../../../api/apiClient'
import {
  addGalleryImage,
  removeGalleryImage,
  removeMainImage,
  setMainImage,
  updateGalleryOrder,
  type AdminMediaAsset,
  type AdminNewsImage,
} from '../../../api/adminMediaApi'
import AdminDialog from './AdminDialog'
import MediaPickerDialog from './MediaPickerDialog'

type NewsMediaSectionProps = {
  newsId?: string
  initialMainImage?: AdminMediaAsset | null
  initialGallery?: AdminNewsImage[]
  disabled?: boolean
  onMainImageChange?: (asset: AdminMediaAsset | null) => void
  onGalleryChange?: (gallery: AdminNewsImage[]) => void
}

type PickerTarget = 'main' | 'gallery' | null

function sortGallery(items: AdminNewsImage[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder)
}

function normalizeOrder(items: AdminNewsImage[]) {
  return items.map((item, index) => ({ ...item, sortOrder: index + 1 }))
}

export default function NewsMediaSection({
  newsId,
  initialMainImage = null,
  initialGallery = [],
  disabled = false,
  onMainImageChange,
  onGalleryChange,
}: NewsMediaSectionProps) {
  const [mainImage, setMainImageState] = useState<AdminMediaAsset | null>(initialMainImage)
  const [gallery, setGallery] = useState<AdminNewsImage[]>(() => sortGallery(initialGallery))
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null)
  const [selectedGalleryAsset, setSelectedGalleryAsset] = useState<AdminMediaAsset | null>(null)
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryAltText, setGalleryAltText] = useState('')
  const [pendingRemoveGallery, setPendingRemoveGallery] = useState<AdminNewsImage | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const galleryMediaIds = useMemo(
    () => new Set(gallery.map((item) => item.mediaAssetId)),
    [gallery],
  )

  function handleError(message: string, apiError: unknown) {
    if (apiError instanceof ApiError && apiError.status === 401) {
      setError('Sesion expirada. Vuelve a iniciar sesion.')
      return
    }

    setError(apiError instanceof Error ? apiError.message : message)
  }

  async function handleSelectMain(asset: AdminMediaAsset) {
    if (!newsId) {
      return
    }

    try {
      setIsWorking(true)
      setError(null)
      const updated = await setMainImage(newsId, asset.id)
      setMainImageState(updated)
      onMainImageChange?.(updated)
      setPickerTarget(null)
      setSuccess('Imagen principal actualizada.')
    } catch (selectError) {
      handleError('No pudimos asignar la imagen principal.', selectError)
    } finally {
      setIsWorking(false)
    }
  }

  function handleSelectGallery(asset: AdminMediaAsset) {
    if (galleryMediaIds.has(asset.id)) {
      setError('La imagen ya existe en la galeria de esta noticia.')
      return
    }

    setSelectedGalleryAsset(asset)
    setGalleryAltText(asset.altText ?? '')
    setGalleryCaption('')
    setPickerTarget(null)
    setError(null)
  }

  async function confirmAddGalleryImage() {
    if (!newsId || !selectedGalleryAsset) {
      return
    }

    try {
      setIsWorking(true)
      setError(null)
      const created = await addGalleryImage(newsId, {
        mediaAssetId: selectedGalleryAsset.id,
        caption: galleryCaption.trim() || null,
        altText: galleryAltText.trim() || null,
        sortOrder: gallery.length + 1,
      })
      const nextGallery = sortGallery([...gallery, created])
      setGallery(nextGallery)
      onGalleryChange?.(nextGallery)
      setSelectedGalleryAsset(null)
      setGalleryCaption('')
      setGalleryAltText('')
      setSuccess('Imagen agregada a la galeria.')
    } catch (addError) {
      handleError('No pudimos agregar la imagen a la galeria.', addError)
    } finally {
      setIsWorking(false)
    }
  }

  async function handleRemoveMainImage() {
    if (!newsId) {
      return
    }

    try {
      setIsWorking(true)
      setError(null)
      await removeMainImage(newsId)
      setMainImageState(null)
      onMainImageChange?.(null)
      setSuccess('Imagen principal quitada.')
    } catch (removeError) {
      handleError('No pudimos quitar la imagen principal.', removeError)
    } finally {
      setIsWorking(false)
    }
  }

  async function confirmRemoveGalleryImage() {
    if (!newsId || !pendingRemoveGallery) {
      return
    }

    try {
      setIsWorking(true)
      setError(null)
      await removeGalleryImage(newsId, pendingRemoveGallery.id)
      const nextGallery = normalizeOrder(gallery.filter((item) => item.id !== pendingRemoveGallery.id))
      setGallery(nextGallery)
      onGalleryChange?.(nextGallery)
      setPendingRemoveGallery(null)
      setSuccess('Imagen quitada de la galeria.')
    } catch (removeError) {
      handleError('No pudimos quitar la imagen de la galeria.', removeError)
    } finally {
      setIsWorking(false)
    }
  }

  async function moveGalleryImage(index: number, direction: -1 | 1) {
    if (!newsId) {
      return
    }

    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= gallery.length) {
      return
    }

    const reordered = [...gallery]
    const [item] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, item)
    const nextGallery = normalizeOrder(reordered)

    try {
      setIsWorking(true)
      setError(null)
      await updateGalleryOrder(
        newsId,
        nextGallery.map((image) => ({ imageId: image.id, sortOrder: image.sortOrder })),
      )
      setGallery(nextGallery)
      onGalleryChange?.(nextGallery)
      setSuccess('Orden de galeria actualizado.')
    } catch (orderError) {
      handleError('No pudimos ordenar la galeria.', orderError)
    } finally {
      setIsWorking(false)
    }
  }

  if (!newsId) {
    return (
      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Imagenes</h2>
        <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Guarda la noticia primero para poder asignar imagen principal y galeria.
        </p>
      </section>
    )
  }

  return (
    <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">Imagenes</h2>
        <p className="mt-1 text-sm text-slate-600">
          Usa imagenes de la biblioteca o sube una nueva desde el selector. Videos: solo URL externa.
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

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Imagen principal</h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {mainImage ? (
              <img
                className="aspect-[4/3] w-full object-cover"
                src={buildPublicAssetUrl(mainImage.url)}
                alt={mainImage.altText ?? mainImage.originalFileName}
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-sm text-slate-500">
                Sin imagen principal
              </div>
            )}
          </div>
          <div className="mt-3 grid gap-2">
            <button
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-brand-green bg-brand-green px-4 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63] disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              onClick={() => setPickerTarget('main')}
              disabled={disabled || isWorking}
            >
              <ImagePlus aria-hidden="true" size={16} />
              Seleccionar / subir
            </button>
            {mainImage ? (
              <button
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                onClick={handleRemoveMainImage}
                disabled={disabled || isWorking}
              >
                <X aria-hidden="true" size={16} />
                Quitar principal
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Galeria</h3>
              <p className="mt-1 text-xs text-slate-500">{gallery.length}/20 imagenes</p>
            </div>
            <button
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              onClick={() => setPickerTarget('gallery')}
              disabled={disabled || isWorking || gallery.length >= 20}
            >
              <ImagePlus aria-hidden="true" size={16} />
              Agregar imagen
            </button>
          </div>

          {gallery.length === 0 ? (
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Todavia no hay imagenes en la galeria.
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {gallery.map((image, index) => (
                <article
                  className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[8rem_1fr_auto]"
                  key={image.id}
                >
                  <img
                    className="aspect-[4/3] w-full rounded-md bg-slate-100 object-cover"
                    src={buildPublicAssetUrl(image.media.url)}
                    alt={image.altText ?? image.media.altText ?? image.media.originalFileName}
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-950">
                      {image.media.originalFileName}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">Orden {image.sortOrder}</p>
                    {image.caption ? (
                      <p className="mt-2 text-sm text-slate-600">{image.caption}</p>
                    ) : null}
                    {image.altText ? (
                      <p className="mt-1 text-xs text-slate-500">Alt: {image.altText}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <button
                      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      aria-label="Subir imagen en galeria"
                      onClick={() => moveGalleryImage(index, -1)}
                      disabled={disabled || isWorking || index === 0}
                    >
                      <ArrowUp aria-hidden="true" size={16} />
                    </button>
                    <button
                      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      aria-label="Bajar imagen en galeria"
                      onClick={() => moveGalleryImage(index, 1)}
                      disabled={disabled || isWorking || index === gallery.length - 1}
                    >
                      <ArrowDown aria-hidden="true" size={16} />
                    </button>
                    <button
                      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      aria-label="Quitar imagen de galeria"
                      onClick={() => setPendingRemoveGallery(image)}
                      disabled={disabled || isWorking}
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {pickerTarget ? (
        <MediaPickerDialog
          title={pickerTarget === 'main' ? 'Elegir imagen principal' : 'Agregar a galeria'}
          description="El selector tambien permite subir una imagen nueva antes de elegirla."
          selectedId={pickerTarget === 'main' ? mainImage?.id : null}
          onClose={() => setPickerTarget(null)}
          onSelect={pickerTarget === 'main' ? handleSelectMain : handleSelectGallery}
        />
      ) : null}

      {selectedGalleryAsset ? (
        <AdminDialog
          title="Agregar imagen a galeria"
          description={selectedGalleryAsset.originalFileName}
          confirmLabel="Agregar"
          isSubmitting={isWorking}
          onCancel={() => setSelectedGalleryAsset(null)}
          onConfirm={confirmAddGalleryImage}
        >
          <div className="grid gap-4">
            <img
              className="aspect-video w-full rounded-md bg-slate-100 object-cover"
              src={buildPublicAssetUrl(selectedGalleryAsset.url)}
              alt={selectedGalleryAsset.altText ?? selectedGalleryAsset.originalFileName}
            />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Caption
              <input
                className="focus-ring min-h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-950 outline-none"
                value={galleryCaption}
                onChange={(event) => setGalleryCaption(event.target.value)}
                maxLength={300}
              />
              <span className="text-xs font-normal text-slate-500">
                Pie de foto visible debajo de la imagen.
              </span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Alt text
              <input
                className="focus-ring min-h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-950 outline-none"
                value={galleryAltText}
                onChange={(event) => setGalleryAltText(event.target.value)}
                maxLength={250}
              />
              <span className="text-xs font-normal text-slate-500">
                Descripcion accesible de la imagen.
              </span>
            </label>
          </div>
        </AdminDialog>
      ) : null}

      {pendingRemoveGallery ? (
        <AdminDialog
          title="Quitar imagen de galeria"
          description="La imagen se quita solo de esta noticia. El archivo queda disponible en la biblioteca."
          confirmLabel="Quitar"
          tone="danger"
          isSubmitting={isWorking}
          onCancel={() => setPendingRemoveGallery(null)}
          onConfirm={confirmRemoveGalleryImage}
        />
      ) : null}
    </section>
  )
}
