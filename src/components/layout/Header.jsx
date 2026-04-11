import { Menu } from 'lucide-react'

export default function Header({ title, subtitle, actions, onMenuClick }) {
  return (
    <header className="header">
      <div className="header__left">
        {onMenuClick && (
          <button className="header__menu-btn" onClick={onMenuClick} aria-label="Abrir menú">
            <Menu size={20} strokeWidth={2} />
          </button>
        )}
        <div>
          <div className="header__title">{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="header__right">{actions}</div>}
    </header>
  )
}
