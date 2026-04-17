import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { currentUser, login, error, setError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  if (currentUser) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const ok = await login(username, password)
    setSubmitting(false)
    if (ok) navigate('/')
  }

  const fillDemo = (user, pass) => {
    setUsername(user); setPassword(pass); setError('')
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <PawPrint size={28} strokeWidth={2} color="white" />
        </div>
        <h1 className="login-title">VetAdmin</h1>
        <p className="login-subtitle">Sistema de Gestión Veterinaria</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="login-label">Usuario</label>
            <input
              className="login-input"
              type="text"
              placeholder="Ingresá tu usuario"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="login-label">Contraseña</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Usuario o contraseña incorrectos</span>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="demo-accounts" style={{ marginTop: 20 }}>
          <div className="demo-accounts__title">Acceso rápido</div>
          <div className="demo-account" onClick={() => fillDemo('dgarcias', 'drokerson')}>
            <div className="demo-account__info">
              <span>dgarcias</span><span>/ drokerson</span>
            </div>
            <span className="demo-account__role">Administrador</span>
          </div>
        </div>
      </div>
    </div>
  )
}
