export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const formatDate = (dateStr, opts = {}) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...opts,
  })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
    .format(amount ?? 0)

export const todayStr = () => new Date().toISOString().slice(0, 10)

export const calcAge = (birthDate) => {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 12) return `${months} mes${months !== 1 ? 'es' : ''}`
  const years = Math.floor(months / 12)
  return `${years} año${years !== 1 ? 's' : ''}`
}

export const daysUntil = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - now) / 86400000)
}

export const speciesEmoji = (species) => {
  const map = {
    perro: '🐕', gato: '🐈', conejo: '🐇', pajaro: '🐦',
    hamster: '🐹', pez: '🐟', tortuga: '🐢', otro: '🐾',
  }
  return map[species?.toLowerCase()] ?? '🐾'
}

export const speciesLabel = (species) => {
  const map = {
    perro: 'Perro', gato: 'Gato', conejo: 'Conejo', pajaro: 'Pájaro',
    hamster: 'Hámster', pez: 'Pez', tortuga: 'Tortuga', otro: 'Otro',
  }
  return map[species?.toLowerCase()] ?? species ?? '—'
}

export const appointmentStatusLabel = (s) => ({
  pending:   'Pendiente',
  confirmed: 'Confirmado',
  attended:  'Atendido',
  cancelled: 'Cancelado',
}[s] ?? s)

export const appointmentStatusColor = (s) => ({
  pending:   'orange',
  confirmed: 'blue',
  attended:  'green',
  cancelled: 'red',
}[s] ?? 'gray')

export const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

export const avatarColor = (name = '') => {
  const colors = ['#007AFF','#34C759','#FF9F0A','#AF52DE','#32ADE6','#5856D6','#FF3B30','#FF6B35']
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % colors.length
  return colors[Math.abs(hash)]
}
