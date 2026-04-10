export default function Header({ title, subtitle, actions }) {
  return (
    <header className="header">
      <div className="header__left">
        <div>
          <div className="header__title">{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="header__right">{actions}</div>}
    </header>
  )
}
