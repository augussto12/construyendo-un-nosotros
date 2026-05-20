import { Edit3, Plus, Power, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../api/apiClient'
import type { AdminCategoryDto } from '../../../api/adminNewsApi'
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
  type UpsertAdminCategoryRequest,
} from '../../../api/adminTaxonomyApi'
import AdminDialog from '../components/AdminDialog'

type CategoryFormState = {
  name: string
  slug: string
  description: string
  sortOrder: string
  isActive: boolean
}

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  sortOrder: '0',
  isActive: true,
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function isValidSlug(value: string) {
  return !value.trim() || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())
}

function toForm(category: AdminCategoryDto): CategoryFormState {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
  }
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<AdminCategoryDto[]>([])
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<AdminCategoryDto | null>(null)
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

    async function loadCategories() {
      try {
        setIsLoading(true)
        setError(null)
        setItems(await getAdminCategories(controller.signal))
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof ApiError && loadError.status === 401
            ? 'Sesion expirada. Vuelve a iniciar sesion.'
            : 'No pudimos cargar las categorias.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadCategories()

    return () => controller.abort()
  }, [])

  function updateField<Key extends keyof CategoryFormState>(key: Key, value: CategoryFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate() {
    if (!form.name.trim()) {
      return 'El nombre es obligatorio.'
    }

    if (!isValidSlug(form.slug)) {
      return 'El slug solo puede usar minusculas, numeros y guiones.'
    }

    if (!Number.isFinite(Number(form.sortOrder))) {
      return 'El orden debe ser numerico.'
    }

    return null
  }

  function buildPayload(): UpsertAdminCategoryRequest | null {
    const validation = validate()
    if (validation) {
      setError(validation)
      return null
    }

    return {
      name: form.name.trim(),
      slug: optional(form.slug),
      description: optional(form.description),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
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
        ? await updateAdminCategory(editingId, payload)
        : await createAdminCategory(payload)
      setItems((current) => {
        const exists = current.some((item) => item.id === saved.id)
        const next = exists
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved]
        return next.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      })
      setForm(emptyForm)
      setEditingId(null)
      setSuccess(editingId ? 'Categoria actualizada.' : 'Categoria creada.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No pudimos guardar la categoria.')
    } finally {
      setIsSaving(false)
    }
  }

  async function confirmDeactivate() {
    if (!pendingDeactivate) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await deleteAdminCategory(pendingDeactivate.id)
      setItems((current) =>
        current.map((item) =>
          item.id === pendingDeactivate.id ? { ...item, isActive: false } : item,
        ),
      )
      setPendingDeactivate(null)
      setSuccess('Categoria desactivada.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No pudimos desactivar la categoria.')
    } finally {
      setIsSaving(false)
    }
  }

  function startEdit(category: AdminCategoryDto) {
    setEditingId(category.id)
    setForm(toForm(category))
    setError(null)
    setSuccess(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
          Taxonomia
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Categorias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Administra las categorias usadas para clasificar noticias.
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">
            {editingItem ? `Editar: ${editingItem.name}` : 'Nueva categoria'}
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
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_8rem]">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span className="inline-flex items-baseline gap-1">
              Nombre <span className="text-red-600">*</span>
            </span>
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              maxLength={140}
              required
            />
            <span className="text-xs font-normal text-slate-500">
              Nombre visible para agrupar noticias.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Slug
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              value={form.slug}
              onChange={(event) => updateField('slug', event.target.value)}
              placeholder="se-autogenera-si-queda-vacio"
              maxLength={160}
            />
            <span className="text-xs font-normal text-slate-500">
              Identificador para filtros y URLs.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Orden
            <input
              className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
              type="number"
              value={form.sortOrder}
              onChange={(event) => updateField('sortOrder', event.target.value)}
            />
            <span className="text-xs font-normal text-slate-500">
              Define prioridad en listados.
            </span>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Descripcion
          <textarea
            className="focus-ring min-h-24 rounded-md border border-slate-200 px-3 py-2 text-base text-slate-950 outline-none"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            maxLength={500}
          />
          <span className="text-xs font-normal text-slate-500">
            Texto interno o publico de apoyo.
          </span>
        </label>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            className="h-4 w-4"
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
          />
          <span>
            Categoria activa
            <span className="block text-xs font-normal text-slate-500">
              Disponible para nuevas noticias y filtros publicos.
            </span>
          </span>
        </label>
        <button
          className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-brand-green bg-brand-green px-5 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63] disabled:cursor-not-allowed disabled:opacity-70 sm:w-max"
          type="submit"
          disabled={isSaving}
        >
          <Plus aria-hidden="true" size={17} />
          {isSaving ? 'Guardando...' : editingItem ? 'Guardar cambios' : 'Crear categoria'}
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-950">Listado</h2>
          <span className="text-sm text-slate-500">{items.length} categoria(s)</span>
        </div>
        {isLoading ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Cargando categorias...
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Todavia no hay categorias.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Nombre</th>
                  <th className="py-3 pr-4">Slug</th>
                  <th className="py-3 pr-4">Orden</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((category) => (
                  <tr key={category.id}>
                    <td className="py-3 pr-4 font-semibold text-slate-950">{category.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{category.slug}</td>
                    <td className="py-3 pr-4 text-slate-600">{category.sortOrder}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        category.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {category.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          type="button"
                          onClick={() => startEdit(category)}
                          disabled={isSaving}
                        >
                          <Edit3 aria-hidden="true" size={15} />
                          Editar
                        </button>
                        <button
                          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          onClick={() => setPendingDeactivate(category)}
                          disabled={isSaving || !category.isActive}
                        >
                          <Power aria-hidden="true" size={15} />
                          Desactivar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingDeactivate ? (
        <AdminDialog
          title="Desactivar categoria"
          description={`La categoria "${pendingDeactivate.name}" dejara de estar disponible para nuevas noticias.`}
          confirmLabel="Desactivar"
          tone="danger"
          isSubmitting={isSaving}
          onCancel={() => setPendingDeactivate(null)}
          onConfirm={confirmDeactivate}
        />
      ) : null}
    </section>
  )
}
