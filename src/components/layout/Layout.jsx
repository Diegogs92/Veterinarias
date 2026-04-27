import { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'

function installRipple() {
  if (window.__rippleInstalled) return
  window.__rippleInstalled = true
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .row, a, .pet-card, .stat, .stat-card, .sb__item, .sidebar__item')
    if (!target || e.target.closest('input, textarea, select')) return
    const el = document.createElement('span')
    el.className = 'click-ripple'
    el.style.left = e.clientX + 'px'
    el.style.top  = e.clientY + 'px'
    el.style.transform = 'translate(-50%,-50%)'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 550)
  })
}

export default function Layout() {
  const { currentUser } = useAuth()
  const { loading } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { installRipple() }, [])

  if (!currentUser) return <Navigate to="/login" replace />

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          width: 28, height: 28, border: '2.5px solid var(--border)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Cargando datos...</span>
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
        <Outlet context={{ openSidebar: () => setSidebarOpen(o => !o) }} />
      </div>
    </div>
  )
}
