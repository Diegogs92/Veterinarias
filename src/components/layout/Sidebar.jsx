import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, PawPrint, CalendarDays,
  Stethoscope, Syringe, ShoppingCart, Hospital,
  Banknote, Moon, Sun, LogOut, PackageSearch, ShieldCheck,
} from 'lucide-react'
import { useAuth, ROLE_LABELS } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { initials, avatarColor } from '../../utils/helpers'

const NAV = [
  { to: '/',              Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/owners',        Icon: Users,           label: 'Dueños' },
  { to: '/pets',          Icon: PawPrint,        label: 'Mascotas' },
  { to: '/appointments',  Icon: CalendarDays,    label: 'Turnos' },
  { to: '/consultations', Icon: Stethoscope,     label: 'Historial Clínico' },
  { to: '/vaccines',      Icon: Syringe,         label: 'Vacunas' },
  { to: '/catalog',       Icon: PackageSearch,   label: 'Catálogo' },
  { to: '/sales',         Icon: ShoppingCart,    label: 'Ventas' },
  { to: '/internments',   Icon: Hospital,        label: 'Internación' },
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
          <PawPrint size={18} strokeWidth={2} color="white" />
        </div>
        <span className="sidebar__logo-text">VetAdmin</span>
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
