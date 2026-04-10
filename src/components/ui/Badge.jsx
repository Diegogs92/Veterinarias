export default function Badge({ color = 'gray', children, dot = false }) {
  return (
    <span className={`badge badge--${color}`}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'currentColor', display: 'inline-block', flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  )
}
