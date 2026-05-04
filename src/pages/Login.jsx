import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { PawPrint, Eye, EyeOff, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { currentUser, login, error, setError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (currentUser) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const ok = await login(username, password)
    setSubmitting(false)
    if (ok) navigate('/')
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
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
            <div style={{ position: 'relative' }}>
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
              </button>
            </div>
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

        {installPrompt && (
          <button className="login-install-btn" onClick={handleInstall}>
            <Download size={16} strokeWidth={2} />
            Instalar app móvil
          </button>
        )}
      </div>

      <a
        href="https://wa.me/5493815151163"
        target="_blank"
        rel="noopener noreferrer"
        className="login-footer"
      >
        Desarrollado por DGS Solutions
      </a>
    </div>
  )
}
