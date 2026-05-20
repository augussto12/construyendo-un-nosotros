import { Edit3, KeyRound, Plus, Power, UserCheck } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../api/apiClient'
import {
  activateAdminUser,
  createAdminUser,
  deactivateAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  type AdminBackofficeUser,
  type AdminUserRole,
} from '../../../api/adminUsersApi'
import { useAdminAuth } from '../auth/adminAuthContext'
import AdminDialog from '../components/AdminDialog'

type UserFormState = {
  displayName: string
  email: string
  role: AdminUserRole
  password: string
}

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; user: AdminBackofficeUser }
  | { type: 'reset'; user: AdminBackofficeUser }
  | { type: 'deactivate'; user: AdminBackofficeUser }
  | { type: 'activate'; user: AdminBackofficeUser }
  | null

const emptyForm: UserFormState = {
  displayName: '',
  email: '',
  role: 'Editor',
  password: '',
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sin registro'
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function roleBadge(role: AdminUserRole) {
  return role === 'Admin'
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-slate-100 text-slate-700'
}

export default function AdminUsersPage() {
  const { adminUser } = useAdminAuth()
  const isAdmin = adminUser?.role === 'Admin'
  const [users, setUsers] = useState<AdminBackofficeUser[]>([])
  const [isLoading, setIsLoading] = useState(isAdmin)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm)
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1
        }
        return a.displayName.localeCompare(b.displayName)
      }),
    [users],
  )

  async function loadUsers(signal?: AbortSignal) {
    const result = await getAdminUsers(signal)
    setUsers(result)
  }

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    const controller = new AbortController()

    async function run() {
      try {
        setIsLoading(true)
        setError(null)
        await loadUsers(controller.signal)
      } catch (loadError) {
        if (!controller.signal.aborted) {
          if (loadError instanceof ApiError && loadError.status === 403) {
            setError('Solo un usuario Admin puede administrar usuarios.')
          } else {
            setError('No pudimos cargar los usuarios.')
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void run()
    return () => controller.abort()
  }, [isAdmin])

  function openCreateDialog() {
    setForm(emptyForm)
    setPasswordConfirm('')
    setError(null)
    setSuccess(null)
    setDialog({ type: 'create' })
  }

  function openEditDialog(user: AdminBackofficeUser) {
    setForm({
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      password: '',
    })
    setPasswordConfirm('')
    setError(null)
    setSuccess(null)
    setDialog({ type: 'edit', user })
  }

  function closeDialog() {
    if (isSubmitting) {
      return
    }

    setDialog(null)
    setForm(emptyForm)
    setPasswordConfirm('')
  }

  function validateUserForm(requirePassword: boolean) {
    if (!form.displayName.trim()) {
      return 'El nombre es obligatorio.'
    }
    if (!validateEmail(form.email)) {
      return 'El email no tiene un formato valido.'
    }
    if (requirePassword && form.password.length < 10) {
      return 'La password debe tener al menos 10 caracteres.'
    }
    if (requirePassword && form.password !== passwordConfirm) {
      return 'Las passwords no coinciden.'
    }
    return null
  }

  async function handleCreateOrEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dialog || (dialog.type !== 'create' && dialog.type !== 'edit')) {
      return
    }

    const validation = validateUserForm(dialog.type === 'create')
    if (validation) {
      setError(validation)
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      if (dialog.type === 'create') {
        await createAdminUser({
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password,
        })
        setSuccess('Usuario creado.')
      } else {
        await updateAdminUser(dialog.user.id, {
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          role: form.role,
        })
        setSuccess('Usuario actualizado.')
      }

      setForm(emptyForm)
      setPasswordConfirm('')
      setDialog(null)
      await loadUsers()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos guardar el usuario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dialog || dialog.type !== 'reset') {
      return
    }

    if (form.password.length < 10) {
      setError('La password debe tener al menos 10 caracteres.')
      return
    }
    if (form.password !== passwordConfirm) {
      setError('Las passwords no coinciden.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await resetAdminUserPassword(dialog.user.id, { password: form.password })
      setSuccess('Password actualizada.')
      setForm(emptyForm)
      setPasswordConfirm('')
      setDialog(null)
      await loadUsers()
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'No pudimos resetear la password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleActivationAction() {
    if (!dialog || (dialog.type !== 'activate' && dialog.type !== 'deactivate')) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)
      if (dialog.type === 'activate') {
        await activateAdminUser(dialog.user.id)
        setSuccess('Usuario activado.')
      } else {
        await deactivateAdminUser(dialog.user.id)
        setSuccess('Usuario desactivado.')
      }
      setDialog(null)
      await loadUsers()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No pudimos completar la accion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Solo un usuario Admin puede administrar usuarios.
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#428f4f]">
            Seguridad
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Usuarios</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Crea administradores y editores para cargar contenido en el backoffice.
          </p>
        </div>
        <button
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-brand-green bg-brand-green px-4 text-sm font-semibold text-brand-ink transition hover:bg-[#50ba63]"
          type="button"
          onClick={openCreateDialog}
        >
          <Plus aria-hidden="true" size={16} />
          Nuevo usuario
        </button>
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
          Cargando usuarios...
        </p>
      ) : sortedUsers.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Todavia no hay usuarios.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Ultimo login</th>
                  <th className="px-4 py-3">Actualizado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">{user.displayName}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(user.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          type="button"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit3 aria-hidden="true" size={14} />
                          Editar
                        </button>
                        <button
                          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          type="button"
                          onClick={() => {
                            setForm({ ...emptyForm, password: '' })
                            setPasswordConfirm('')
                            setError(null)
                            setSuccess(null)
                            setDialog({ type: 'reset', user })
                          }}
                        >
                          <KeyRound aria-hidden="true" size={14} />
                          Password
                        </button>
                        <button
                          className={`focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                            user.isActive
                              ? 'border-amber-200 text-amber-800 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                          }`}
                          type="button"
                          onClick={() => {
                            setError(null)
                            setSuccess(null)
                            setDialog({ type: user.isActive ? 'deactivate' : 'activate', user })
                          }}
                        >
                          {user.isActive ? <Power aria-hidden="true" size={14} /> : <UserCheck aria-hidden="true" size={14} />}
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(dialog?.type === 'create' || dialog?.type === 'edit') ? (
        <AdminDialog
          title={dialog.type === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
          description="Los usuarios Admin administran settings y usuarios. Los Editor cargan contenido."
          confirmLabel={dialog.type === 'create' ? 'Crear usuario' : 'Guardar cambios'}
          isSubmitting={isSubmitting}
          onCancel={closeDialog}
          onConfirm={() => {
            const formElement = document.getElementById('admin-user-form') as HTMLFormElement | null
            formElement?.requestSubmit()
          }}
        >
          <form className="grid gap-4" id="admin-user-form" onSubmit={handleCreateOrEdit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nombre *
              <input
                className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
                value={form.displayName}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email *
              <input
                className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Rol *
              <select
                className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AdminUserRole }))}
              >
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            {dialog.type === 'create' ? (
              <>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Password inicial *
                  <input
                    className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                  <span className="text-xs font-normal text-slate-500">Minimo 10 caracteres.</span>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Repetir password *
                  <input
                    className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
                    type="password"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                  />
                </label>
              </>
            ) : null}
          </form>
        </AdminDialog>
      ) : null}

      {dialog?.type === 'reset' ? (
        <AdminDialog
          title="Resetear password"
          description={`Vas a definir una nueva password temporal para ${dialog.user.displayName}.`}
          confirmLabel="Actualizar password"
          isSubmitting={isSubmitting}
          onCancel={closeDialog}
          onConfirm={() => {
            const formElement = document.getElementById('admin-user-password-form') as HTMLFormElement | null
            formElement?.requestSubmit()
          }}
        >
          <form className="grid gap-4" id="admin-user-password-form" onSubmit={handleResetPassword}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nueva password *
              <input
                className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              <span className="text-xs font-normal text-slate-500">Minimo 10 caracteres.</span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Repetir password *
              <input
                className="focus-ring min-h-11 rounded-md border border-slate-200 px-3 text-base text-slate-950 outline-none"
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </label>
          </form>
        </AdminDialog>
      ) : null}

      {(dialog?.type === 'activate' || dialog?.type === 'deactivate') ? (
        <AdminDialog
          title={dialog.type === 'activate' ? 'Activar usuario' : 'Desactivar usuario'}
          description={
            dialog.type === 'activate'
              ? `El usuario ${dialog.user.displayName} podra volver a ingresar al backoffice.`
              : `El usuario ${dialog.user.displayName} no podra ingresar al backoffice.`
          }
          confirmLabel={dialog.type === 'activate' ? 'Activar' : 'Desactivar'}
          tone={dialog.type === 'deactivate' ? 'danger' : 'default'}
          isSubmitting={isSubmitting}
          onCancel={closeDialog}
          onConfirm={handleActivationAction}
        />
      ) : null}
    </section>
  )
}
