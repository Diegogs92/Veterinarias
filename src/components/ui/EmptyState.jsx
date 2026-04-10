export default function EmptyState({ icon, title = 'Sin datos', text = '', action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <div className="empty-state__title">{title}</div>
      {text && <p className="empty-state__text">{text}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}
