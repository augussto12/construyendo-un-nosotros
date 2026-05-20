import { Save } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../api/apiClient'
import {
  getAdminSettings,
  updateAdminSetting,
  type AdminSiteSetting,
} from '../../../api/adminSettingsApi'

const settingLabels: Record<string, { label: string; description: string; placeholder?: string }> = {
  donationUrl: {
    label: 'Link de donacion',
    description: 'Solo link configurable. No procesa pagos ni comprobantes.',
    placeholder: 'https://...',
  },
  contactEmail: {
    label: 'Email de contacto',
    description: 'Email publico para consultas.',
    placeholder: 'contacto@dominio.org',
  },
  whatsappUrl: {
    label: 'WhatsApp',
    description: 'Link publico de WhatsApp.',
    placeholder: 'https://wa.me/549...',
  },
  instagramUrl: {
    label: 'Instagram',
    description: 'Perfil publico de Instagram.',
    placeholder: 'https://instagram.com/...',
  },
  facebookUrl: {
    label: 'Facebook',
    description: 'Pagina publica de Facebook.',
    placeholder: 'https://facebook.com/...',
  },
  youtubeUrl: {
    label: 'YouTube',
    description: 'Canal o video institucional.',
    placeholder: 'https://youtube.com/...',
  },
  addressText: {
    label: 'Direccion',
    description: 'Texto de direccion para mostrar en el sitio.',
  },
  footerText: {
    label: 'Texto de footer',
    description: 'Texto corto para pie de pagina.',
  },
}

function validateSetting(setting: AdminSiteSetting, value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (setting.type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
      ? null
      : 'El email no tiene un formato valido.'
  }

  if (setting.type === 'url') {
    try {
      const url = new URL(trimmed)
      return url.protocol === 'http:' || url.protocol === 'https:'
        ? null
        : 'La URL debe comenzar con http:// o https://.'
    } catch {
      return 'La URL debe ser valida.'
    }
  }

  return null
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSiteSetting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const sortedSettings = useMemo(
    () =>
      [...settings].sort(
        (a, b) =>
          Object.keys(settingLabels).indexOf(a.key) - Object.keys(settingLabels).indexOf(b.key),
      ),
    [settings],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadSettings() {
      try {
        setIsLoading(true)
        setError(null)
        const result = await getAdminSettings(controller.signal)
        setSettings(result)
        setValues(Object.fromEntries(result.map((setting) => [setting.key, setting.value])))
      } catch (loadError) {
        if (!controller.signal.aborted) {
          if (loadError instanceof ApiError && loadError.status === 401) {
            setError('Sesion expirada. Vuelve a iniciar sesion.')
          } else if (loadError instanceof ApiError && loadError.status === 403) {
            setError('Solo un usuario Admin puede administrar settings.')
          } else {
            setError('No pudimos cargar los settings.')
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadSettings()

    return () => controller.abort()
  }, [])

  async function handleSave(event: FormEvent<HTMLFormElement>, setting: AdminSiteSetting) {
    event.preventDefault()
    const value = values[setting.key] ?? ''
    const validation = validateSetting(setting, value)
    if (validation) {
      setError(validation)
      return
    }

    try {
      setSavingKey(setting.key)
      setError(null)
      setSuccess(null)
      const updated = await updateAdminSetting(setting.key, { value: value.trim() })
      setSettings((current) =>
        current.map((item) => (item.key === updated.key ? updated : item)),
      )
      setValues((current) => ({ ...current, [updated.key]: updated.value }))
      setSuccess(`${settingLabels[setting.key]?.label ?? setting.key} actualizado.`)
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.status === 403) {
        setError('Solo un usuario Admin puede administrar settings.')
      } else {
        setError(saveError instanceof Error ? saveError.message : 'No pudimos guardar el setting.')
      }
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
          Configuracion
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Datos publicos basicos del sitio. El link de donacion es solo configurable; no procesa pagos.
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

      {isLoading ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Cargando settings...
        </p>
      ) : sortedSettings.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No hay settings disponibles.
        </p>
      ) : (
        <div className="grid gap-4">
          {sortedSettings.map((setting) => {
            const meta = settingLabels[setting.key] ?? {
              label: setting.key,
              description: 'Setting publico.',
            }
            const isTextArea = setting.key === 'addressText' || setting.key === 'footerText'
            return (
              <form
                className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={setting.key}
                onSubmit={(event) => handleSave(event, setting)}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">{meta.label}</h2>
                    <p className="mt-1 text-sm text-slate-600">{meta.description}</p>
                  </div>
                  <span className="mt-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 sm:mt-0">
                    {setting.type}
                  </span>
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Valor
                  {isTextArea ? (
                    <textarea
                      className="focus-ring min-h-24 rounded-md border border-slate-200 px-3 py-2 text-base text-slate-950 outline-none"
                      value={values[setting.key] ?? ''}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [setting.key]: event.target.value }))
                      }
                      maxLength={2000}
                    />
                  ) : (
                    <input
                      className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
                      value={values[setting.key] ?? ''}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [setting.key]: event.target.value }))
                      }
                      placeholder={meta.placeholder}
                      maxLength={2000}
                    />
                  )}
                </label>
                <button
                  className="focus-ring inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-brand-green bg-brand-green px-4 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63] disabled:cursor-not-allowed disabled:opacity-70 sm:w-max"
                  type="submit"
                  disabled={Boolean(savingKey)}
                >
                  <Save aria-hidden="true" size={16} />
                  {savingKey === setting.key ? 'Guardando...' : 'Guardar'}
                </button>
              </form>
            )
          })}
        </div>
      )}
    </section>
  )
}
