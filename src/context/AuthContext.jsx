import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        setCurrentUser({
          id: session.user.id,
          name: meta.name || session.user.email,
          username: meta.username || session.user.email.split('@')[0],
          role: meta.role || 'vet',
        })
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata || {}
        setCurrentUser({
          id: session.user.id,
          name: meta.name || session.user.email,
          username: meta.username || session.user.email.split('@')[0],
          role: meta.role || 'vet',
        })
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (username, password) => {
    setError('')
    const email = `${username}@vetadmin.local`
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Usuario o contraseña incorrectos')
      return false
    }
    return true
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  const isVet = currentUser?.role === 'vet'
  const canViewFinances = isVet

  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
        color: 'var(--text-secondary)', fontSize: 14,
      }}>
        Iniciando...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, error, setError, isVet, canViewFinances }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
