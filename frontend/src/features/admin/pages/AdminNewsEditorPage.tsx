import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../api/apiClient'
import {
  createNews,
  getAdminNewsById,
  updateNews,
  type AdminNewsDetail,
  type AdminNewsStatus,
  type UpsertAdminNewsRequest,
} from '../../../api/adminNewsApi'
import NewsEditorForm from '../components/NewsEditorForm'

type SaveIntent = 'save' | 'draft' | 'publish' | 'schedule'

const successByIntent: Record<SaveIntent, string> = {
  save: 'Cambios guardados.',
  draft: 'Borrador guardado.',
  publish: 'Noticia publicada. Ya esta visible en el sitio publico.',
  schedule: 'Noticia programada. Se publicara en la fecha indicada.',
}

export default function AdminNewsEditorPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const [news, setNews] = useState<AdminNewsDetail | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        setNews(id ? await getAdminNewsById(id, controller.signal) : null)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }

        setErrorMessage('No pudimos cargar los datos de la noticia.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => controller.abort()
  }, [id, navigate])

  async function save(payload: UpsertAdminNewsRequest, intent: SaveIntent = 'save') {
    try {
      setIsSaving(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      if (id) {
        const updated = await updateNews(id, payload)
        setNews(updated)
        setSuccessMessage(`${successByIntent[intent]} Slug actual: ${updated.slug}`)
        return
      }

      const created = await createNews(payload)
      setSuccessMessage(`${successByIntent[intent]} Slug actual: ${created.slug}`)
      navigate(`/admin/noticias/${created.id}`, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate('/admin/login', { replace: true })
        return
      }

      setErrorMessage('No pudimos guardar la noticia. Revisa los campos e intenta nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  function goBack() {
    navigate('/admin/noticias')
  }

  function saveWithStatus(
    payload: UpsertAdminNewsRequest,
    status: AdminNewsStatus,
    intent: SaveIntent,
  ) {
    return save({ ...payload, status }, intent)
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
          Noticias
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          {isEditing ? 'Editar noticia' : 'Nueva noticia'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Formulario editorial con editor visual, imagen principal, galeria y vista previa.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Cargando noticia...
        </div>
      ) : errorMessage && !news && isEditing ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : (
        <>
          {errorMessage ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </p>
          ) : null}
          <NewsEditorForm
            key={`${news?.id ?? 'new'}-${news?.updatedAt ?? ''}-${news?.slug ?? ''}`}
            initialNews={news}
            isSaving={isSaving}
            onSubmit={(payload) => save(payload, 'save')}
            onSaveDraft={(payload) => saveWithStatus(payload, 'Draft', 'draft')}
            onPublish={(payload) => saveWithStatus(payload, 'Published', 'publish')}
            onSchedule={(payload) => saveWithStatus(payload, 'Scheduled', 'schedule')}
            onBack={goBack}
          />
        </>
      )}
    </section>
  )
}
