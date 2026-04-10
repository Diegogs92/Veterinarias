import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { currentUser, login, error, setError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  if (currentUser) return <Navigate to="/" replace />

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(username, password)) navigate('/')
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

          <button type="submit" className="login-btn">Iniciar sesión</button>
        </form>

        <div className="demo-accounts" style={{ marginTop: 20 }}>
          <div className="demo-accounts__title">Cuentas de demo</div>
          <div className="demo-account" onClick={() => fillDemo('vet', '1234')}>
            <div className="demo-account__info">
              <span>vet</span><span>/ 1234</span>
            </div>
            <span className="demo-account__role">Veterinario</span>
          </div>
          <div className="demo-account" onClick={() => fillDemo('recep', '1234')}>
            <div className="demo-account__info">
              <span>recep</span><span>/ 1234</span>
            </div>
            <span className="demo-account__role">Recepcionista</span>
          </div>
        </div>
      </div>
    </div>
  )
}
