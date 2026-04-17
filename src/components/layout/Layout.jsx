import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'

export default function Layout() {
  const { currentUser } = useAuth()
  const { loading } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!currentUser) return <Navigate to="/login" replace />

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, border: '3px solid var(--border)',
          borderTopColor: 'var(--vet-teal)', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Cargando datos...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(o => !o)} />
        <Outlet />
      </div>
    </div>
  )
}
