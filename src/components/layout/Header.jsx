import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Menu, Moon, Sun, LogOut, ChevronDown } from 'lucide-react'
import { useAuth, ROLE_LABELS } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { initials, avatarColor } from '../../utils/helpers'

export default function Header({ title, subtitle }) {
  const ctx = useOutletContext() || {}
  const onMenuClick = ctx.openSidebar
  const { currentUser, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="header">
      <div className="header__left">
        {onMenuClick && (
          <button className="header__menu-btn" onClick={onMenuClick} aria-label="Abrir menú">
            <Menu size={24} strokeWidth={2} />
          </button>
        )}
        <div>
          <div className="header__title">{title}</div>
          {subtitle && <div className="header__subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="header__right">
        {/* Toggle de tema */}
        <button
          className="btn btn--subtle btn--icon"
          onClick={toggle}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark'
            ? <Sun size={20} strokeWidth={1.85} />
            : <Moon size={20} strokeWidth={1.85} />
          }
        </button>

        {/* Menú de usuario */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px 4px 4px', borderRadius: 999,
              background: 'transparent', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-primary)',
              transition: 'background var(--t-fast), border-color var(--t-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sub)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            aria-label="Menú de usuario"
          >
            <div className="avatar avatar--sm" style={{ background: avatarColor(currentUser?.name || ''), width: 34, height: 34, fontSize: 13 }}>
              {initials(currentUser?.name || '')}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.15 }} className="header__user-info">
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{currentUser?.name?.split(' ')[0]}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                {ROLE_LABELS[currentUser?.role] || currentUser?.role}
              </div>
            </div>
            <ChevronDown size={16} strokeWidth={2} style={{ color: 'var(--text-tertiary)' }} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              minWidth: 220, background: 'var(--bg-elev)',
              border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
              zIndex: 60,
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-2)' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser?.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {ROLE_LABELS[currentUser?.role] || currentUser?.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', background: 'transparent', border: 'none',
                  color: 'var(--danger)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <LogOut size={17} strokeWidth={2} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
