import { createContext, useContext, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { INITIAL_USERS } from '../data/initialData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [users] = useLocalStorage('vet_users', INITIAL_USERS)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vet_session')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [error, setError] = useState('')

  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password)
    if (user) {
      const session = { id: user.id, name: user.name, username: user.username, role: user.role }
      setCurrentUser(session)
      sessionStorage.setItem('vet_session', JSON.stringify(session))
      setError('')
      return true
    }
    setError('Usuario o contraseña incorrectos')
    return false
  }

  const logout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem('vet_session')
  }

  const isVet = currentUser?.role === 'vet'
  const canViewFinances = isVet

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, error, setError, isVet, canViewFinances }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
