import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck, Crown, Wrench, UserCircle2 } from 'lucide-react'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { useAuth, ROLE_LABELS } from '../../context/AuthContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import UserForm from './UserForm'
import { formatDate } from '../../utils/helpers'

const ROLE_BADGE = {
  developer: { color: 'purple', Icon: Wrench },
  owner:     { color: 'teal',   Icon: Crown },
  employee:  { color: 'blue',   Icon: UserCircle2 },
}

export default function UsersPage() {
  const { currentUser, canManageUsers } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error: e } = await supabase.from('profiles').select('*').order('created_at')
    if (!e) setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (!canManageUsers) {
    return (
      <>
        <Header title="Usuarios" subtitle="Gestión de usuarios" />
        <div className="page">
          <EmptyState
            icon={<ShieldCheck size={48} strokeWidth={1.25} />}
            title="Acceso restringido"
            text="Solo el dueño o el desarrollador pueden gestionar usuarios."
          />
        </div>
      </>
    )
  }

  const handleSave = async (data) => {
    setError('')
    try {
      if (editing) {
        // Update auth metadata
        const updatePayload = {
          user_metadata: { name: data.name, username: editing.username, role: data.role },
        }
        if (data.password) updatePayload.password = data.password

        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(editing.id, updatePayload)
        if (authErr) { setError(authErr.message); return }

        // Update profile
        await supabase.from('profiles').update({
          name: data.name,
          role: data.role,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        }).eq('id', editing.id)
      } else {
        // Create auth user
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: `${data.username}@vetadmin.local`,
          password: data.password,
          user_metadata: { name: data.name, username: data.username, role: data.role },
          email_confirm: true,
        })
        if (authErr) { setError(authErr.message); return }

        // Insert profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          name: data.name,
          username: data.username,
          role: data.role,
          is_active: true,
        })
      }
      setFormOpen(false)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message || 'Error al guardar')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await supabaseAdmin.auth.admin.deleteUser(deleting.id)
      await supabase.from('profiles').delete().eq('id', deleting.id)
      setDeleting(null)
      load()
    } catch (e) {
      setError(e.message || 'Error al eliminar')
    }
    setDeleteLoading(false)
  }

  const openEdit = (user) => { setEditing(user); setFormOpen(true); setError('') }
  const openNew  = ()     => { setEditing(null); setFormOpen(true); setError('') }

  return (
    <>
      <Header
        title="Usuarios"
        subtitle={`${users.length} usuarios registrados`}
        actions={
          <button className="btn btn--primary" onClick={openNew}>
            <Plus size={16} /> Nuevo usuario
          </button>
        }
      />

      <div className="page">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-tertiary)' }}>Cargando...</div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UserCircle2 size={48} strokeWidth={1.25} />}
            title="Sin usuarios"
            text="Creá el primer usuario del sistema"
            action={<button className="btn btn--primary" onClick={openNew}><Plus size={16} /> Nuevo usuario</button>}
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const badge  = ROLE_BADGE[u.role] || ROLE_BADGE.employee
                    const isSelf = u.id === currentUser?.id
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                              background: `var(--vet-${badge.color === 'purple' ? 'violet' : badge.color === 'teal' ? 'teal' : 'sky'})`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: 13, fontWeight: 700,
                            }}>
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-mono)' }}>
                                @{u.username}
                                {isSelf && (
                                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6, fontFamily: 'var(--font-sans)' }}>
                                    (vos)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td>
                          <Badge color={badge.color} dot>{ROLE_LABELS[u.role] || u.role}</Badge>
                        </td>
                        <td>
                          <Badge color={u.is_active ? 'green' : 'red'} dot>
                            {u.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(u.created_at)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn--subtle btn--sm btn--icon"
                              onClick={() => openEdit(u)}
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn btn--subtle btn--sm btn--icon"
                              onClick={() => setDeleting(u)}
                              title="Eliminar"
                              style={{ color: 'var(--vet-rose)' }}
                              disabled={isSelf}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role legend */}
        <div style={{
          marginTop: 24, padding: '16px 20px',
          background: 'var(--surface-2)', borderRadius: 'var(--r-lg)',
          display: 'flex', flexWrap: 'wrap', gap: 24,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, alignSelf: 'center' }}>Roles:</span>
          {[
            { role: 'developer', desc: 'Acceso a todas las herramientas, incluyendo las en prueba' },
            { role: 'owner',     desc: 'Acceso a herramientas testeadas + gestión de usuarios' },
            { role: 'employee',  desc: 'Acceso solo a las herramientas habilitadas para su perfil' },
          ].map(({ role, desc }) => {
            const badge = ROLE_BADGE[role]
            return (
              <div key={role} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Badge color={badge.color} dot>{ROLE_LABELS[role]}</Badge>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, maxWidth: 220 }}>{desc}</span>
              </div>
            )
          })}
        </div>
      </div>

      <UserForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); setError('') }}
        onSave={handleSave}
        initial={editing}
        serverError={error}
      />

      {deleting && (
        <Modal
          isOpen
          onClose={() => setDeleting(null)}
          title="Eliminar usuario"
          size="sm"
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 15 }}>
            ¿Eliminar al usuario <strong>@{deleting.username}</strong>?
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            Esta acción no se puede deshacer. El usuario no podrá ingresar al sistema.
          </p>
        </Modal>
      )}
    </>
  )
}
