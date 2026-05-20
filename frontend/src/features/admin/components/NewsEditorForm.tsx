import { CalendarClock, Save, Send, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type {
  AdminNewsDetail,
  AdminNewsStatus,
  UpsertAdminNewsRequest,
} from '../../../api/adminNewsApi'
import type { AdminMediaAsset, AdminNewsImage } from '../../../api/adminMediaApi'
import NewsMediaSection from './NewsMediaSection'
import NewsEditorialPreview from './NewsEditorialPreview'
import RichTextEditor from './RichTextEditor'
import { hasUnsafeHtml } from '../utils/htmlSanitizer'

type NewsEditorFormProps = {
  initialNews?: AdminNewsDetail | null
  isSaving: boolean
  onSubmit: (payload: UpsertAdminNewsRequest) => Promise<void>
  onSaveDraft: (payload: UpsertAdminNewsRequest) => Promise<void>
  onPublish: (payload: UpsertAdminNewsRequest) => Promise<void>
  onSchedule: (payload: UpsertAdminNewsRequest) => Promise<void>
  onBack: () => void
}

type FormState = {
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  status: AdminNewsStatus
  publishedAt: string
  expiresAt: string
  authorName: string
  isFeatured: boolean
  featuredOrder: string
  sortOrder: string
  videoUrl: string
  videoProvider: string
  sourceUrl: string
  seoTitle: string
  seoDescription: string
}

const statusLabels: Record<AdminNewsStatus, string> = {
  Draft: 'Borrador',
  Published: 'Publicada',
  Scheduled: 'Programada',
  Unpublished: 'Despublicada',
  Expired: 'Expirada',
  Archived: 'Archivada',
}

const statusClasses: Record<AdminNewsStatus, string> = {
  Draft: 'border-slate-200 bg-slate-100 text-slate-700',
  Published: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Scheduled: 'border-sky-200 bg-sky-50 text-sky-800',
  Unpublished: 'border-amber-200 bg-amber-50 text-amber-900',
  Expired: 'border-orange-200 bg-orange-50 text-orange-900',
  Archived: 'border-slate-300 bg-slate-200 text-slate-700',
}

const videoProviders = [
  { value: '', label: 'Detectar luego / externo' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'external', label: 'Otro externo' },
]

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function toIsoOrNull(value: string) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function initialState(news?: AdminNewsDetail | null): FormState {
  return {
    title: news?.title ?? '',
    slug: news?.slug ?? '',
    excerpt: news?.excerpt ?? '',
    contentHtml: news?.contentHtml ?? '',
    status: (news?.status as AdminNewsStatus | undefined) ?? 'Draft',
    publishedAt: toDateTimeLocal(news?.publishedAt),
    expiresAt: toDateTimeLocal(news?.expiresAt),
    authorName: news?.authorName ?? '',
    isFeatured: news?.isFeatured ?? false,
    featuredOrder: String(news?.featuredOrder ?? 0),
    sortOrder: String(news?.sortOrder ?? 0),
    videoUrl: news?.videoUrl ?? '',
    videoProvider: news?.videoProvider ?? '',
    sourceUrl: news?.sourceUrl ?? '',
    seoTitle: news?.seoTitle ?? '',
    seoDescription: news?.seoDescription ?? '',
  }
}

function isValidUrl(value: string) {
  if (!value.trim()) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidSlug(value: string) {
  return !value.trim() || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())
}

function StatusBadge({ status }: { status: AdminNewsStatus }) {
  return (
    <span
      className={`inline-flex w-max rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClasses[status] ?? statusClasses.Draft
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  )
}

export default function NewsEditorForm({
  initialNews,
  isSaving,
  onSubmit,
  onSaveDraft,
  onPublish,
  onSchedule,
  onBack,
}: NewsEditorFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(initialNews))
  const [validationError, setValidationError] = useState<string | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [isScheduling, setIsScheduling] = useState(initialNews?.status === 'Scheduled')
  const [mainImage, setMainImage] = useState<AdminMediaAsset | null>(initialNews?.mainImage ?? null)
  const [gallery, setGallery] = useState<AdminNewsImage[]>(initialNews?.gallery ?? [])

  const seoDescriptionCount = form.seoDescription.length
  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate(state: FormState) {
    if (!state.title.trim()) {
      return 'El titulo es obligatorio.'
    }

    if (!state.excerpt.trim()) {
      return 'La bajada/resumen es obligatoria.'
    }

    if (!state.contentHtml.trim()) {
      return 'El contenido es obligatorio.'
    }

    if (hasUnsafeHtml(state.contentHtml)) {
      return 'El contenido no puede incluir scripts, handlers on* ni URLs javascript:.'
    }

    if (!isValidSlug(state.slug)) {
      return 'El slug solo puede usar minusculas, numeros y guiones.'
    }

    const publishedAt = toIsoOrNull(state.publishedAt)
    const expiresAt = toIsoOrNull(state.expiresAt)

    if (state.status === 'Scheduled') {
      if (!publishedAt) {
        return 'Las noticias programadas requieren fecha de publicacion.'
      }

      if (new Date(publishedAt) <= new Date()) {
        return 'La fecha programada debe ser futura.'
      }
    }

    if (publishedAt && expiresAt && new Date(expiresAt) <= new Date(publishedAt)) {
      return 'La fecha de expiracion debe ser posterior a la publicacion.'
    }

    if (!isValidUrl(state.videoUrl)) {
      return 'La URL de video debe ser valida.'
    }

    if (!isValidUrl(state.sourceUrl)) {
      return 'La URL de fuente debe ser valida.'
    }

    if (state.seoDescription.length > 320) {
      return 'La SEO description no debe superar 320 caracteres.'
    }

    return null
  }

  function buildPayload(statusOverride?: AdminNewsStatus): UpsertAdminNewsRequest | null {
    const nextForm = { ...form, status: statusOverride ?? form.status }
    const error = validate(nextForm)
    if (error) {
      setValidationError(error)
      return null
    }

    setValidationError(null)

    return {
      title: nextForm.title.trim(),
      slug: optional(nextForm.slug),
      excerpt: nextForm.excerpt.trim(),
      contentHtml: nextForm.contentHtml.trim(),
      status: nextForm.status,
      publishedAt:
        nextForm.status === 'Published' && !nextForm.publishedAt
          ? new Date().toISOString()
          : toIsoOrNull(nextForm.publishedAt),
      expiresAt: toIsoOrNull(nextForm.expiresAt),
      authorName: optional(nextForm.authorName),
      isFeatured: nextForm.isFeatured,
      featuredOrder: Number(nextForm.featuredOrder) || 0,
      sortOrder: Number(nextForm.sortOrder) || 0,
      videoUrl: optional(nextForm.videoUrl),
      videoProvider: optional(nextForm.videoProvider),
      sourceUrl: optional(nextForm.sourceUrl),
      seoTitle: optional(nextForm.seoTitle),
      seoDescription: optional(nextForm.seoDescription),
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = buildPayload()
    if (payload) {
      await onSubmit(payload)
    }
  }

  async function handleSaveDraft() {
    const payload = buildPayload('Draft')
    if (payload) {
      await onSaveDraft(payload)
    }
  }

  async function handlePublish() {
    const payload = buildPayload('Published')
    if (payload) {
      await onPublish({ ...payload, publishedAt: new Date().toISOString() })
    }
  }

  async function handleSchedule() {
    if (!isScheduling) {
      setIsScheduling(true)
      setValidationError(null)
      return
    }

    const payload = buildPayload('Scheduled')
    if (payload) {
      await onSchedule(payload)
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <div className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:w-max sm:flex-row">
        <button
          className={`focus-ring inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition ${
            mode === 'edit'
              ? 'bg-slate-950 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          type="button"
          onClick={() => setMode('edit')}
        >
          Editar
        </button>
        <button
          className={`focus-ring inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition ${
            mode === 'preview'
              ? 'bg-slate-950 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          type="button"
          onClick={() => setMode('preview')}
        >
          Vista previa
        </button>
      </div>

      {validationError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {validationError}
        </p>
      ) : null}

      {mode === 'preview' ? (
        <NewsEditorialPreview value={form} mainImage={mainImage} gallery={gallery} />
      ) : null}

      {mode === 'edit' ? (
        <>
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span className="inline-flex items-baseline gap-1">
              Titulo <span className="text-red-600">*</span>
            </span>
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              maxLength={220}
              required
            />
            <span className="text-xs font-normal text-slate-500">
              Se ve en cards, detalle y home si esta destacada.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Slug
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.slug}
              onChange={(event) => updateField('slug', event.target.value)}
              placeholder="se-autogenera-si-queda-vacio"
              maxLength={240}
            />
            <span className="text-xs font-normal text-slate-500">
              Define la URL publica: /noticias/este-slug.
            </span>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          <span className="inline-flex items-baseline gap-1">
            Bajada / resumen <span className="text-red-600">*</span>
          </span>
          <textarea
            className="focus-ring min-h-24 rounded-md border border-slate-200 px-3 py-2 text-base text-slate-950 outline-none"
            value={form.excerpt}
            onChange={(event) => updateField('excerpt', event.target.value)}
            maxLength={600}
            required
          />
          <span className="text-xs font-normal text-slate-500">
            Texto corto para cards, detalle y SEO si no hay descripcion.
          </span>
        </label>
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Contenido <span className="text-red-600">*</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Cuerpo principal de la noticia. Se muestra en el detalle publico.
          </p>
        </div>
        <RichTextEditor
          value={form.contentHtml}
          onChange={(value) => updateField('contentHtml', value)}
        />
      </section>

      <NewsMediaSection
        newsId={initialNews?.id}
        initialMainImage={mainImage}
        initialGallery={gallery}
        disabled={isSaving}
        onMainImageChange={setMainImage}
        onGalleryChange={setGallery}
      />

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Publicacion</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 text-sm font-medium text-slate-700">
            Estado actual
            <div className="flex min-h-11 items-center rounded-md border border-slate-200 px-3">
              <StatusBadge status={form.status} />
            </div>
            <span className="text-xs font-normal text-slate-500">
              Para cambiarlo usa Guardar borrador, Publicar o Programar.
            </span>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Expiracion
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) => updateField('expiresAt', event.target.value)}
            />
            <span className="text-xs font-normal text-slate-500">
              Opcional. Oculta la noticia despues de esa fecha.
            </span>
          </label>
        </div>
        {isScheduling ? (
          <div className="grid gap-3 rounded-md border border-sky-200 bg-sky-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-sky-950">Programar publicacion</h3>
                <p className="mt-1 text-sm text-sky-900">
                  Elegi el dia y la hora en que la noticia debe salir publicada.
                </p>
              </div>
              <button
                className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-900 transition hover:bg-sky-100"
                type="button"
                onClick={() => setIsScheduling(false)}
                aria-label="Cancelar programacion"
                disabled={isSaving}
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>
            <label className="grid max-w-sm gap-2 text-sm font-medium text-slate-700">
              Dia y hora
              <input
                className="focus-ring min-h-11 rounded-md border border-sky-200 bg-white px-3 text-base text-slate-950 outline-none"
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) => updateField('publishedAt', event.target.value)}
              />
            </label>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Autor
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.authorName}
              onChange={(event) => updateField('authorName', event.target.value)}
              maxLength={160}
            />
            <span className="text-xs font-normal text-slate-500">
              Dato editorial para mostrar en preview/detalle.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Orden general
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              type="number"
              value={form.sortOrder}
              onChange={(event) => updateField('sortOrder', event.target.value)}
            />
            <span className="text-xs font-normal text-slate-500">
              Reserva para ordenar listados internos.
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4"
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => updateField('isFeatured', event.target.checked)}
            />
            <span>
              Destacar en home
              <span className="block text-xs font-normal text-slate-500">
                Aparece en la tira de noticias destacadas.
              </span>
            </span>
          </label>
        </div>
        {form.isFeatured ? (
          <label className="grid max-w-xs gap-2 text-sm font-medium text-slate-700">
            Orden destacado
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              type="number"
              value={form.featuredOrder}
              onChange={(event) => updateField('featuredOrder', event.target.value)}
            />
            <span className="text-xs font-normal text-slate-500">
              Menor numero, mayor prioridad.
            </span>
          </label>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Video y fuente</h2>
        <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            URL de video embebido
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.videoUrl}
              onChange={(event) => updateField('videoUrl', event.target.value)}
              placeholder="https://youtube.com/..."
            />
            <span className="text-xs font-normal text-slate-500">
              Solo link externo. No se suben videos.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Proveedor
            <select
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.videoProvider}
              onChange={(event) => updateField('videoProvider', event.target.value)}
            >
              {videoProviders.map((provider) => (
                <option key={provider.value || 'none'} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-slate-500">
              Ayuda a embeber YouTube o Vimeo.
            </span>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          URL fuente
          <input
            className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
            value={form.sourceUrl}
            onChange={(event) => updateField('sourceUrl', event.target.value)}
            placeholder="https://..."
            maxLength={1000}
          />
          <span className="text-xs font-normal text-slate-500">
            Link externo relacionado con la noticia.
          </span>
        </label>
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Como aparece en Google</h2>
          <p className="mt-1 text-sm text-slate-600">
            Estos textos ayudan a que la noticia se entienda mejor cuando aparece en buscadores o al compartirla.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Titulo para buscadores
          <input
            className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
            value={form.seoTitle}
            onChange={(event) => updateField('seoTitle', event.target.value)}
            maxLength={220}
          />
          <span className="text-xs font-normal text-slate-500">
            Si lo dejas vacio, se usa el titulo de la noticia.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Descripcion para buscadores
          <textarea
            className="focus-ring min-h-24 rounded-md border border-slate-200 px-3 py-2 text-base text-slate-950 outline-none"
            value={form.seoDescription}
            onChange={(event) => updateField('seoDescription', event.target.value)}
            maxLength={320}
          />
          <span className="text-xs text-slate-500">{seoDescriptionCount}/320 caracteres</span>
          <span className="text-xs font-normal text-slate-500">
            Es el resumen que puede verse en Google o al compartir. Si queda vacia, se usa la bajada.
          </span>
        </label>
      </section>
        </>
      ) : null}

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:shadow-sm">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            type="button"
            onClick={onBack}
            disabled={isSaving}
          >
            Volver
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              Guardar borrador
            </button>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-900 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              onClick={handleSchedule}
              disabled={isSaving}
            >
              <CalendarClock aria-hidden="true" size={17} />
              <span>{isScheduling ? 'Confirmar programacion' : 'Programar'}</span>
            </button>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-emerald-600 bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
            >
              <Send aria-hidden="true" size={17} />
              <span>{isSaving ? 'Publicando...' : 'Publicar'}</span>
            </button>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-brand-green bg-brand-green px-5 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSaving}
            >
              <Save aria-hidden="true" size={17} />
              <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
