import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Scissors, ShoppingCart, Hospital,
  Banknote, Moon, Sun, LogOut, PackageSearch, ShieldCheck,
  Stethoscope, Home,
} from 'lucide-react'
import { useAuth, ROLE_LABELS } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { initials, avatarColor } from '../../utils/helpers'

function DogLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="4.5" cy="6.5" rx="3" ry="4.5" fill="white" opacity="0.9" transform="rotate(-12 4.5 6.5)" />
      <ellipse cx="15.5" cy="6.5" rx="3" ry="4.5" fill="white" opacity="0.9" transform="rotate(12 15.5 6.5)" />
      <circle cx="10" cy="12" r="6.5" fill="white" />
      <circle cx="7.8" cy="10.5" r="1.1" fill="#1a6bc4" />
      <circle cx="12.2" cy="10.5" r="1.1" fill="#1a6bc4" />
      <ellipse cx="10" cy="13.5" rx="1.8" ry="1.2" fill="#1a6bc4" />
      <path d="M8 15.5 Q10 17.5 12 15.5" stroke="#1a6bc4" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

const NAV = [
  { to: '/',            Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/owners-pets', Icon: Users,           label: 'Dueños y Mascotas' },
  { to: '/consultas',   Icon: Stethoscope,     label: 'Consultas' },
  { to: '/grooming',    Icon: Scissors,        label: 'Peluquería' },
  { to: '/boarding',    Icon: Home,            label: 'Pensionados' },
  { to: '/internments', Icon: Hospital,        label: 'Internación' },
  { to: '/catalog',     Icon: PackageSearch,   label: 'Catálogo' },
  { to: '/sales',       Icon: ShoppingCart,    label: 'Ventas' },
]

const NAV_VET = [
  { to: '/finances', Icon: Banknote, label: 'Caja / Finanzas' },
]

const NAV_ADMIN = [
  { to: '/users', Icon: ShieldCheck, label: 'Usuarios' },
]

export default function Sidebar({ open, onClose }) {
  const { currentUser, logout, isVet, canManageUsers } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => { onClose?.() }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <DogLogo />
        </div>
        <span className="sidebar__logo-text">Salud Animal</span>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section-title">Menú</div>
        {NAV.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}
            data-tooltip={label}
          >
            <span className="sidebar__item-icon">
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <span className="sidebar__item-text">{label}</span>
          </NavLink>
        ))}

        {(isVet || canManageUsers) && (
          <>
            <div className="sidebar__section-title" style={{ marginTop: 8 }}>Administración</div>
            {NAV_VET.map(({ to, Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}
                data-tooltip={label}
              >
                <span className="sidebar__item-icon">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className="sidebar__item-text">{label}</span>
              </NavLink>
            ))}
            {canManageUsers && (
              <>
                {NAV_ADMIN.map(({ to, Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}
                    data-tooltip={label}
                  >
                    <span className="sidebar__item-icon">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="sidebar__item-text">{label}</span>
                  </NavLink>
                ))}
              </>
            )}
          </>
        )}
      </nav>

      <div className="sidebar__footer">
        <button
          className="sidebar__item"
          style={{ width: '100%', border: 'none', background: 'transparent', marginBottom: 4 }}
          onClick={toggle}
          data-tooltip={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <span className="sidebar__item-icon">
            {theme === 'dark'
              ? <Sun size={16} strokeWidth={1.75} />
              : <Moon size={16} strokeWidth={1.75} />
            }
          </span>
          <span className="sidebar__item-text">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>

        <div className="sidebar__user" onClick={handleLogout} title="Cerrar sesión">
          <div
            className="sidebar__avatar"
            style={{ background: avatarColor(currentUser?.name || '') }}
          >
            {initials(currentUser?.name || '')}
          </div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{currentUser?.name}</div>
            <div className="sidebar__user-role">
              {ROLE_LABELS[currentUser?.role] || currentUser?.role}
            </div>
          </div>
          <LogOut size={14} strokeWidth={1.75} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  )
}
