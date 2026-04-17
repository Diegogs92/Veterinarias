import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Roles with full access (backward compat: 'vet' treated as owner)
const ADMIN_ROLES = ['developer', 'owner', 'vet']

export const ROLE_LABELS = {
  developer: 'Desarrollador',
  owner:     'Dueño',
  employee:  'Empleado',
  // backward compat
  vet:          'Veterinario',
  receptionist: 'Recepcionista',
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')

  const buildUser = (supabaseUser) => {
    const meta = supabaseUser.user_metadata || {}
    return {
      id:       supabaseUser.id,
      name:     meta.name || supabaseUser.email,
      username: meta.username || supabaseUser.email.split('@')[0],
      role:     meta.role || 'employee',
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUser(buildUser(session.user))
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(buildUser(session.user))
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (username, password) => {
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${username}@vetadmin.local`, password,
    })
    if (authError) { setError('Usuario o contraseña incorrectos'); return false }
    return true
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  const isVet          = ADMIN_ROLES.includes(currentUser?.role)
  const canViewFinances = isVet
  const canManageUsers  = ['developer', 'owner'].includes(currentUser?.role)

  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', color: 'var(--text-secondary)', fontSize: 14,
      }}>
        Iniciando...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      currentUser, login, logout, error, setError,
      isVet, canViewFinances, canManageUsers,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
