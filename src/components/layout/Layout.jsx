import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

export default function Layout() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
