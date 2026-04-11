import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'

export default function Layout() {
  const { currentUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!currentUser) return <Navigate to="/login" replace />

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
