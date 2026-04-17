import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { Eye, EyeOff } from 'lucide-react'
import { ROLE_LABELS } from '../../context/AuthContext'

const EMPTY = { name: '', username: '', password: '', role: 'employee', isActive: true }

const ROLES = ['developer', 'owner', 'employee']

const ROLE_DESC = {
  developer: 'Acceso a todas las herramientas, incluyendo las que están en prueba.',
  owner:     'Acceso completo a herramientas testeadas. Puede gestionar usuarios.',
  employee:  'Acceso restringido. Solo las herramientas habilitadas para empleados.',
}

export default function UserForm({ isOpen, onClose, onSave, initial = null, serverError = '' }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? { name: initial.name, username: initial.username, password: '', role: initial.role, isActive: initial.is_active }
        : EMPTY
      )
      setErrors({})
      setShowPassword(false)
      setSaving(false)
    }
  }, [isOpen, initial])

  const set = f => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [f]: v }))
    setErrors(p => ({ ...p, [f]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())     e.name     = 'Requerido'
    if (!initial && !form.username.trim()) e.username = 'Requerido'
    if (!initial && !form.username.trim()) e.username = 'Requerido'
    if (!initial && !form.password)        e.password = 'Requerido'
    if (form.username && !/^[a-z0-9_]+$/.test(form.username)) {
      e.username = 'Solo letras minúsculas, números y guión bajo'
    }
    if (form.password && form.password.length < 4) {
      e.password = 'Mínimo 4 caracteres'
    }
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar usuario' : 'Nuevo usuario'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </>
      }
    >
      {serverError && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
          color: 'var(--vet-rose)',
        }}>
          {serverError}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Nombre completo *</label>
        <input
          className={`form-input${errors.name ? ' form-input--error' : ''}`}
          value={form.name} onChange={set('name')}
          placeholder="Ej: Dr. Juan Pérez"
        />
        {errors.name && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.name}</span>}
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Usuario *</label>
          <input
            className={`form-input${errors.username ? ' form-input--error' : ''}`}
            value={form.username} onChange={set('username')}
            placeholder="ej: jperez"
            disabled={!!initial}
            style={initial ? { opacity: 0.6 } : {}}
          />
          {errors.username && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.username}</span>}
          {!initial && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3, display: 'block' }}>
              Se usará para iniciar sesión
            </span>
          )}
          {initial && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3, display: 'block' }}>
              El usuario no puede cambiarse
            </span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">{initial ? 'Nueva contraseña' : 'Contraseña *'}</label>
          <div style={{ position: 'relative' }}>
            <input
              className={`form-input${errors.password ? ' form-input--error' : ''}`}
              type={showPassword ? 'text' : 'password'}
              value={form.password} onChange={set('password')}
              placeholder={initial ? 'Dejar vacío para no cambiar' : '••••••••'}
              style={{ paddingRight: 36 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                display: 'flex', padding: 2,
              }}
            >
              {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
            </button>
          </div>
          {errors.password && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.password}</span>}
        </div>
      </div>

      {/* Role selector */}
      <div className="form-group">
        <label className="form-label">Rol *</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROLES.map(role => (
            <label
              key={role}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${form.role === role ? 'var(--vet-teal)' : 'var(--border)'}`,
                background: form.role === role ? 'rgba(20,184,166,0.06)' : 'transparent',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <input
                type="radio" name="role" value={role}
                checked={form.role === role}
                onChange={set('role')}
                style={{ marginTop: 2, accentColor: 'var(--vet-teal)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ROLE_LABELS[role]}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                  {ROLE_DESC[role]}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {initial && (
        <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            id="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={set('isActive')}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--vet-teal)' }}
          />
          <label htmlFor="isActive" style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Usuario activo
          </label>
        </div>
      )}
    </Modal>
  )
}
