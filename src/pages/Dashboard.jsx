import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Hospital, Scissors, Syringe, ShoppingCart,
  PawPrint, Stethoscope, Home, PackageSearch, Banknote, ShieldCheck,
  Calendar, Activity, Sunrise, Sunset,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import { todayStr, formatCurrency } from '../utils/helpers'

const SHORTCUTS = [
  { to: '/owners-pets', Icon: PawPrint,      label: 'Mascotas',          color: 'var(--vet-emerald)' },
  { to: '/consultas',   Icon: Stethoscope,   label: 'Consultas',         color: 'var(--vet-cyan)' },
  { to: '/cirugias',    Icon: Activity,      label: 'Cirugía',           color: 'var(--vet-rose)' },
  { to: '/vaccines',    Icon: Syringe,       label: 'Vacunas',           color: 'var(--info)'        },
  { to: '/grooming',    Icon: Scissors,      label: 'Peluquería',        color: 'var(--vet-purple)' },
  { to: '/boarding',    Icon: Home,          label: 'Pensionados',       color: 'var(--vet-amber)' },
  { to: '/internments', Icon: Hospital,      label: 'Internación',       color: 'var(--vet-teal)' },
  { to: '/catalog',     Icon: PackageSearch, label: 'Catálogo',          color: 'var(--vet-cyan)' },
  { to: '/sales',       Icon: ShoppingCart,  label: 'Ventas',            color: 'var(--vet-emerald)' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayLabel() {
  const s = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function Dashboard() {
  const { internments, grooming, cirugias, sales } = useApp()
  const { currentUser, isVet, canManageUsers } = useAuth()
  const navigate = useNavigate()

  const today = todayStr()

  const stats = useMemo(() => {
    const groomingToday  = grooming.items.filter(g => g.date === today).length
    const cirugiasToday  = cirugias.items.filter(c => c.date === today).length
    const salesToday     = sales.items.filter(s => s.date === today)
    const internActive   = internments.items.filter(i => i.status !== 'discharged').length
    const internCritical = internments.items.filter(i => i.status === 'critical').length
    const getHour = s => s.createdAt ? new Date(s.createdAt).getHours() : -1
    const turnoManiana = salesToday.filter(s => { const h = getHour(s); return h >= 9 && h < 13 })
    const turnoTarde   = salesToday.filter(s => { const h = getHour(s); return h >= 17 && h < 21 })
    return {
      internActive, internCritical,
      groomingToday, cirugiasToday,
      salesTodayCount:  salesToday.length,
      salesTodayAmount: salesToday.reduce((s, v) => s + (v.total || 0), 0),
      turnoManiana: { count: turnoManiana.length, amount: turnoManiana.reduce((s, v) => s + (v.total || 0), 0) },
      turnoTarde:   { count: turnoTarde.length,   amount: turnoTarde.reduce((s, v) => s + (v.total || 0), 0) },
    }
  }, [internments.items, grooming.items, cirugias.items, sales.items, today])

  const shortcuts = [
    ...SHORTCUTS,
    ...(isVet         ? [{ to: '/finances', Icon: Banknote,    label: 'Caja / Finanzas', color: 'var(--vet-purple)' }] : []),
    ...(canManageUsers ? [{ to: '/users',    Icon: ShieldCheck, label: 'Usuarios',        color: 'var(--vet-cyan)'   }] : []),
  ]

  return (
    <>
      <Header
        title={`${greeting()}, ${currentUser?.name?.split(' ')[0] || ''}`}
        subtitle={todayLabel()}
      />
      <div className="page">

        {/* Resumen de hoy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-secondary)' }}>
          <Calendar size={18} strokeWidth={2} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>Resumen de hoy</span>
        </div>
        <div className="stats-grid" style={{ marginBottom: 32, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          <div className="stat-card" onClick={() => navigate('/internments')}>
            <div className="stat-card__icon" style={{
              color: stats.internCritical ? 'var(--vet-rose)' : 'var(--vet-teal)',
              background: stats.internCritical ? 'var(--danger-3)' : 'var(--accent-3)',
            }}>
              <Hospital size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Internados</div>
            <div className="stat-card__value" style={{ color: stats.internCritical ? 'var(--vet-rose)' : 'var(--vet-teal)' }}>
              {stats.internActive}
            </div>
            {stats.internCritical > 0 && (
              <div className="stat-card__sub" style={{ color: 'var(--vet-rose)', fontWeight: 600 }}>
                {stats.internCritical} en estado crítico
              </div>
            )}
          </div>

          <div className="stat-card" onClick={() => navigate('/grooming')}>
            <div className="stat-card__icon" style={{ color: 'var(--vet-purple)', background: 'rgba(124,58,237,0.10)' }}>
              <Scissors size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Peluquería hoy</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-purple)' }}>{stats.groomingToday}</div>
          </div>

          <div className="stat-card" onClick={() => navigate('/cirugias')}>
            <div className="stat-card__icon" style={{ color: 'var(--vet-rose)', background: 'var(--danger-3)' }}>
              <Syringe size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Cirugías hoy</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-rose)' }}>{stats.cirugiasToday}</div>
          </div>

          <div className="stat-card" onClick={() => navigate('/sales')}>
            <div className="stat-card__icon" style={{ color: 'var(--vet-emerald)', background: 'var(--ok-3)' }}>
              <ShoppingCart size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Ventas hoy</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-emerald)' }}>{stats.salesTodayCount}</div>
            {stats.salesTodayAmount > 0 && (
              <div className="stat-card__sub">{formatCurrency(stats.salesTodayAmount)}</div>
            )}
            {(stats.turnoManiana.count > 0 || stats.turnoTarde.count > 0) && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', fontSize: 12 }}>
                {stats.turnoManiana.count > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sunrise size={13} strokeWidth={2} />
                      Turno Mañana ({stats.turnoManiana.count})
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(stats.turnoManiana.amount)}</span>
                  </div>
                )}
                {stats.turnoTarde.count > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sunset size={13} strokeWidth={2} />
                      Turno Tarde ({stats.turnoTarde.count})
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(stats.turnoTarde.amount)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Accesos directos */}
        <div style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700 }}>
          Accesos directos
        </div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: 0 }}>
          {shortcuts.map(({ to, Icon, label, color }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className="stat-card"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                padding: '26px 18px', gap: 12,
                border: '1px solid var(--border)', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: 14,
                background: 'var(--accent-3)', color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={30} strokeWidth={1.85} />
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
            </button>
          ))}
        </div>

      </div>
    </>
  )
}
