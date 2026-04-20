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
          {subtitle && <div className="header__subtitle">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="header__right">{actions}</div>}
    </header>
  )
}
