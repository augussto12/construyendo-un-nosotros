import {
  Archive,
  CalendarClock,
  Edit,
  EyeOff,
  Plus,
  RotateCw,
  Search,
  Send,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../../api/apiClient'
import {
  archiveNews,
  getAdminNews,
  publishNews,
  scheduleNews,
  unpublishNews,
  type AdminNewsListItem,
  type AdminNewsStatus,
} from '../../../api/adminNewsApi'
import AdminDialog from '../components/AdminDialog'

const statusOptions: Array<{ value: AdminNewsStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'Draft', label: 'Borrador' },
  { value: 'Published', label: 'Publicada' },
  { value: 'Scheduled', label: 'Programada' },
  { value: 'Unpublished', label: 'Despublicada' },
  { value: 'Expired', label: 'Expirada' },
  { value: 'Archived', label: 'Archivada' },
]

const statusLabels: Record<string, string> = {
  Draft: 'Borrador',
  Published: 'Publicada',
  Scheduled: 'Programada',
  Unpublished: 'Despublicada',
  Expired: 'Expirada',
  Archived: 'Archivada',
}

const statusClasses: Record<string, string> = {
  Draft: 'border-slate-200 bg-slate-100 text-slate-700',
  Published: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Scheduled: 'border-sky-200 bg-sky-50 text-sky-800',
  Unpublished: 'border-amber-200 bg-amber-50 text-amber-900',
  Expired: 'border-orange-200 bg-orange-50 text-orange-900',
  Archived: 'border-slate-300 bg-slate-200 text-slate-700',
}

type PendingAction =
  | { type: 'publish'; item: AdminNewsListItem }
  | { type: 'unpublish'; item: AdminNewsListItem }
  | { type: 'archive'; item: AdminNewsListItem }
  | { type: 'schedule'; item: AdminNewsListItem }

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toDateTimeLocalValue(date = new Date(Date.now() + 60 * 60 * 1000)) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function statusLabel(status: string) {
  return statusLabels[status] ?? status
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-max rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClasses[status] ?? statusClasses.Draft
      }`}
    >
      {statusLabel(status)}
    </span>
  )
}

function actionSuccessMessage(action: PendingAction) {
  if (action.type === 'publish') {
    return 'Noticia publicada correctamente.'
  }

  if (action.type === 'schedule') {
    return 'Noticia programada correctamente.'
  }

  if (action.type === 'unpublish') {
    return 'Noticia despublicada correctamente.'
  }

  return 'Noticia archivada correctamente.'
}

export default function AdminNewsListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AdminNewsListItem[]>([])
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [status, setStatus] = useState<AdminNewsStatus | ''>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [scheduleValue, setScheduleValue] = useState(toDateTimeLocalValue())

  const queryParams = useMemo(
    () => ({
      page,
      pageSize,
      search: activeSearch,
      status,
      sort: '-updatedAt',
    }),
    [activeSearch, page, pageSize, status],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadNews() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const response = await getAdminNews(queryParams, controller.signal)
        setItems(response.items)
        setTotalPages(Math.max(1, response.totalPages))
        setTotalItems(response.totalItems)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }

        setErrorMessage('No pudimos cargar las noticias del backoffice.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadNews()

    return () => controller.abort()
  }, [navigate, queryParams])

  function submitSearch() {
    setPage(1)
    setActiveSearch(search.trim())
  }

  function resetFilters() {
    setSearch('')
    setActiveSearch('')
    setStatus('')
    setPage(1)
  }

  function openAction(action: PendingAction) {
    if (action.type === 'schedule') {
      setScheduleValue(toDateTimeLocalValue())
    }
    setActionError(null)
    setActionSuccess(null)
    setPendingAction(action)
  }

  async function refreshCurrentPage() {
    const response = await getAdminNews(queryParams)
    setItems(response.items)
    setTotalPages(Math.max(1, response.totalPages))
    setTotalItems(response.totalItems)
  }

  async function handleConfirmAction() {
    if (!pendingAction || actionLoading) {
      return
    }

    try {
      setActionLoading(true)
      setErrorMessage(null)
      setActionError(null)

      if (pendingAction.type === 'publish') {
        await publishNews(pendingAction.item.id)
      }

      if (pendingAction.type === 'unpublish') {
        await unpublishNews(pendingAction.item.id)
      }

      if (pendingAction.type === 'archive') {
        await archiveNews(pendingAction.item.id)
      }

      if (pendingAction.type === 'schedule') {
        const value = new Date(scheduleValue)
        if (Number.isNaN(value.getTime()) || value <= new Date()) {
          setActionError('La fecha de programacion debe ser futura.')
          setActionLoading(false)
          return
        }
        await scheduleNews(pendingAction.item.id, value.toISOString())
      }

      setActionSuccess(actionSuccessMessage(pendingAction))
      setPendingAction(null)
      await refreshCurrentPage()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate('/admin/login', { replace: true })
        return
      }

      setActionError('No pudimos completar la accion solicitada.')
    } finally {
      setActionLoading(false)
    }
  }

  const dialog = pendingAction ? buildDialog(pendingAction) : null

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
            Noticias
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Gestion de noticias</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Listado editorial conectado al backend para revisar, filtrar y administrar publicaciones.
          </p>
        </div>
        <Link
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-brand-green bg-brand-green px-4 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63]"
          to="/admin/noticias/nueva"
        >
          <Plus aria-hidden="true" size={17} />
          <span>Nueva noticia</span>
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_13rem_auto]">
          <label className="relative block">
            <span className="sr-only">Buscar noticias</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
              size={18}
            />
            <input
              className="focus-ring min-h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-950 outline-none"
              type="search"
              placeholder="Buscar por titulo, resumen o slug"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitSearch()
                }
              }}
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Estado
            <select
              className="focus-ring min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-950 outline-none"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AdminNewsStatus | '')
                setPage(1)
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-slate-200 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="button"
              onClick={submitSearch}
            >
              Buscar
            </button>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              type="button"
              onClick={resetFilters}
              aria-label="Limpiar filtros"
            >
              <RotateCw aria-hidden="true" size={17} />
            </button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </p>
      ) : null}
      {actionSuccess ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionSuccess}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-600">Cargando noticias...</div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <p className="text-sm font-semibold text-slate-950">No hay noticias para mostrar.</p>
            <p className="mt-1 text-sm text-slate-600">
              Ajusta los filtros o crea una nueva noticia cuando el formulario este disponible.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[68rem] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Titulo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Destacado</th>
                  <th className="px-4 py-3">Publicacion</th>
                  <th className="px-4 py-3">Expira</th>
                  <th className="px-4 py-3">Actualizado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr className="align-top hover:bg-slate-50/70" key={item.id}>
                    <td className="max-w-sm px-4 py-4">
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 break-all text-xs text-slate-500">{item.slug}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {item.isFeatured ? `Si (${item.featuredOrder})` : 'No'}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{formatDate(item.publishedAt)}</td>
                    <td className="px-4 py-4 text-slate-700">{formatDate(item.expiresAt)}</td>
                    <td className="px-4 py-4 text-slate-700">{formatDate(item.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-brand-green hover:bg-brand-mint/40"
                          to={`/admin/noticias/${item.id}`}
                          aria-label={`Editar ${item.title}`}
                        >
                          <Edit aria-hidden="true" size={16} />
                        </Link>
                        <button
                          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-brand-green hover:bg-brand-mint/40 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          onClick={() => openAction({ type: 'publish', item })}
                          disabled={item.status === 'Published' || item.status === 'Archived'}
                          aria-label={`Publicar ${item.title}`}
                        >
                          <Send aria-hidden="true" size={16} />
                        </button>
                        <button
                          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-brand-green hover:bg-brand-mint/40 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          onClick={() => openAction({ type: 'schedule', item })}
                          disabled={item.status === 'Archived'}
                          aria-label={`Programar ${item.title}`}
                        >
                          <CalendarClock aria-hidden="true" size={16} />
                        </button>
                        <button
                          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          onClick={() => openAction({ type: 'unpublish', item })}
                          disabled={item.status === 'Unpublished' || item.status === 'Archived'}
                          aria-label={`Despublicar ${item.title}`}
                        >
                          <EyeOff aria-hidden="true" size={16} />
                        </button>
                        <button
                          className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          onClick={() => openAction({ type: 'archive', item })}
                          disabled={item.status === 'Archived'}
                          aria-label={`Archivar ${item.title}`}
                        >
                          <Archive aria-hidden="true" size={16} />
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

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {totalItems} noticia{totalItems === 1 ? '' : 's'} encontrada
          {totalItems === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Anterior
          </button>
          <span className="px-2">
            Pagina {page} de {totalPages}
          </span>
          <button
            className="focus-ring inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>

      {dialog ? (
        <AdminDialog
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.confirmLabel}
          tone={dialog.tone}
          isSubmitting={actionLoading}
          onCancel={() => {
            setActionError(null)
            setPendingAction(null)
          }}
          onConfirm={handleConfirmAction}
        >
          <div className="grid gap-4">
            {actionError ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {actionError}
              </p>
            ) : null}
            {pendingAction?.type === 'schedule' ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Fecha y hora de publicacion
                <input
                  className="focus-ring min-h-11 rounded-md border border-slate-200 bg-white px-3 text-base text-slate-950 outline-none"
                  type="datetime-local"
                  value={scheduleValue}
                  onChange={(event) => setScheduleValue(event.target.value)}
                />
              </label>
            ) : null}
          </div>
        </AdminDialog>
      ) : null}
    </section>
  )
}

function buildDialog(action: PendingAction) {
  if (action.type === 'publish') {
    return {
      title: 'Publicar noticia',
      description: `La noticia "${action.item.title}" quedara publicada inmediatamente.`,
      confirmLabel: 'Publicar',
      tone: 'default' as const,
    }
  }

  if (action.type === 'unpublish') {
    return {
      title: 'Despublicar noticia',
      description: `La noticia "${action.item.title}" dejara de verse publicamente.`,
      confirmLabel: 'Despublicar',
      tone: 'default' as const,
    }
  }

  if (action.type === 'archive') {
    return {
      title: 'Archivar noticia',
      description: `La noticia "${action.item.title}" quedara archivada. No se elimina fisicamente.`,
      confirmLabel: 'Archivar',
      tone: 'danger' as const,
    }
  }

  return {
    title: 'Programar publicacion',
    description: `Elegir una fecha futura para publicar "${action.item.title}".`,
    confirmLabel: 'Programar',
    tone: 'default' as const,
  }
}
