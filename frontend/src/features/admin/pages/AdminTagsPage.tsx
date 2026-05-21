import { Edit3, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../api/apiClient'
import type { AdminTagDto } from '../../../api/adminNewsApi'
import {
  createAdminTag,
  deleteAdminTag,
  getAdminTags,
  updateAdminTag,
  type UpsertAdminTagRequest,
} from '../../../api/adminTaxonomyApi'
import AdminDialog from '../components/AdminDialog'

type TagFormState = {
  name: string
  slug: string
}

const emptyForm: TagFormState = {
  name: '',
  slug: '',
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function isValidSlug(value: string) {
  return !value.trim() || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())
}

function toForm(tag: AdminTagDto): TagFormState {
  return {
    name: tag.name,
    slug: tag.slug,
  }
}

export default function AdminTagsPage() {
  const [items, setItems] = useState<AdminTagDto[]>([])
  const [form, setForm] = useState<TagFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminTagDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadTags() {
      try {
        setIsLoading(true)
        setError(null)
        setItems(await getAdminTags(controller.signal))
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof ApiError && loadError.status === 401
            ? 'Sesion expirada. Vuelve a iniciar sesion.'
            : 'No pudimos cargar los tags.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadTags()

    return () => controller.abort()
  }, [])

  function validate() {
    if (!form.name.trim()) {
      return 'El nombre es obligatorio.'
    }

    if (!isValidSlug(form.slug)) {
      return 'El slug solo puede usar minusculas, numeros y guiones.'
    }

    return null
  }

  function buildPayload(): UpsertAdminTagRequest | null {
    const validation = validate()
    if (validation) {
      setError(validation)
      return null
    }

    return {
      name: form.name.trim(),
      slug: optional(form.slug),
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = buildPayload()
    if (!payload) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)
      const saved = editingId
        ? await updateAdminTag(editingId, payload)
        : await createAdminTag(payload)
      setItems((current) => {
        const exists = current.some((item) => item.id === saved.id)
        const next = exists
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved]
        return next.sort((a, b) => a.name.localeCompare(b.name))
      })
      setForm(emptyForm)
      setEditingId(null)
      setSuccess(editingId ? 'Tag actualizado.' : 'Tag creado.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No pudimos guardar el tag.')
    } finally {
      setIsSaving(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await deleteAdminTag(pendingDelete.id)
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
      setSuccess('Tag eliminado.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No pudimos eliminar el tag.')
    } finally {
      setIsSaving(false)
    }
  }

  function startEdit(tag: AdminTagDto) {
    setEditingId(tag.id)
    setForm(toForm(tag))
    setError(null)
    setSuccess(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
          Taxonomia
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Tags</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Administra etiquetas simples para clasificar y encontrar noticias.
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

      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-950">
            {editingItem ? `Editar: ${editingItem.name}` : 'Nuevo tag'}
          </h2>
          {editingItem ? (
            <button
              className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              type="button"
              onClick={cancelEdit}
              disabled={isSaving}
            >
              <X aria-hidden="true" size={16} />
              Cancelar
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span className="inline-flex items-baseline gap-1">
              Nombre <span className="text-red-600">*</span>
            </span>
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              maxLength={100}
              required
            />
            <span className="text-xs font-normal text-slate-500">
              Etiqueta visible para clasificar noticias.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Slug
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="se-autogenera-si-queda-vacio"
              maxLength={120}
            />
            <span className="text-xs font-normal text-slate-500">
              Identificador para filtros publicos.
            </span>
          </label>
        </div>
        <button
          className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-brand-green bg-brand-green px-5 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63] disabled:cursor-not-allowed disabled:opacity-70 sm:w-max"
          type="submit"
          disabled={isSaving}
        >
          <Plus aria-hidden="true" size={17} />
          {isSaving ? 'Guardando...' : editingItem ? 'Guardar cambios' : 'Crear tag'}
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">Listado</h2>
          <span className="text-sm text-slate-500">{items.length} tag(s)</span>
        </div>
        {isLoading ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Cargando tags...
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Todavia no hay tags.
          </p>
        ) : (
          <div className="grid gap-3">
            {items.map((tag) => (
              <article
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                key={tag.id}
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-950">{tag.name}</h3>
                  <p className="mt-1 break-all text-sm text-slate-500">{tag.slug}</p>
                </div>
                <div className="grid gap-2 sm:flex">
                  <button
                    className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    type="button"
                    onClick={() => startEdit(tag)}
                    disabled={isSaving}
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    Editar
                  </button>
                  <button
                    className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => setPendingDelete(tag)}
                    disabled={isSaving}
                  >
                    <Trash2 aria-hidden="true" size={15} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {pendingDelete ? (
        <AdminDialog
          title="Eliminar tag"
          description={`El tag "${pendingDelete.name}" se quitara tambien de las noticias asociadas.`}
          confirmLabel="Eliminar"
          tone="danger"
          isSubmitting={isSaving}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </section>
  )
}
