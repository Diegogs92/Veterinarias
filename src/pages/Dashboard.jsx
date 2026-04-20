import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PawPrint, Hospital, Banknote, ShoppingCart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Badge from '../components/ui/Badge'
import SpeciesIcon from '../components/ui/SpeciesIcon'
import { formatDate, formatCurrency } from '../utils/helpers'

export default function Dashboard() {
  const { pets, owners, sales, internments } = useApp()
  const { currentUser, isVet } = useAuth()
  const navigate = useNavigate()

  const totalIncome = useMemo(() =>
    sales.items
      .filter(s => s.paymentStatus === 'paid' || s.paymentStatus === 'partial')
      .reduce((s, i) => s + (i.paidAmount || 0), 0),
    [sales.items]
  )

  const activeInternments = useMemo(() =>
    internments.items
      .filter(i => i.status !== 'discharged')
      .sort((a, b) => {
        const order = { critical: 0, active: 1, improving: 2 }
        return (order[a.status] ?? 9) - (order[b.status] ?? 9)
      }),
    [internments.items]
  )

  const recentSales = useMemo(() =>
    [...sales.items]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6),
    [sales.items]
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <>
      <Header title="Dashboard" subtitle={`${greeting()}, ${currentUser?.name?.split(' ')[0]}`} />
      <div className="page">

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/owners-pets')}>
            <div className="stat-card__icon" style={{ color: 'var(--vet-emerald)' }}>
              <PawPrint size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Mascotas registradas</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-emerald)' }}>{pets.items.length}</div>
            <div className="stat-card__sub">{owners.items.length} dueños</div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/internments')}>
            <div className="stat-card__icon" style={{
              color: activeInternments.some(i => i.status === 'critical') ? 'var(--vet-rose)' : 'var(--vet-teal)',
            }}>
              <Hospital size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Internados</div>
            <div className="stat-card__value" style={{
              color: activeInternments.some(i => i.status === 'critical') ? 'var(--vet-rose)' : 'var(--vet-teal)',
            }}>
              {activeInternments.length}
            </div>
            <div className="stat-card__sub">
              {activeInternments.filter(i => i.status === 'critical').length > 0
                ? `${activeInternments.filter(i => i.status === 'critical').length} en estado crítico`
                : 'pacientes activos'}
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/sales')}>
            <div className="stat-card__icon" style={{ color: 'var(--vet-cyan)' }}>
              <ShoppingCart size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Ventas</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-cyan)' }}>{sales.items.length}</div>
            <div className="stat-card__sub">registradas</div>
          </div>

          {isVet && (
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/finances')}>
              <div className="stat-card__icon" style={{ color: 'var(--vet-purple)' }}>
                <Banknote size={32} strokeWidth={1.75} />
              </div>
              <div className="stat-card__label">Ingresos totales</div>
              <div className="stat-card__value" style={{ color: 'var(--vet-purple)', fontSize: 40 }}>{formatCurrency(totalIncome)}</div>
              <div className="stat-card__sub">{sales.items.length} ventas</div>
            </div>
          )}
        </div>

        <div className="two-col-grid">

          {/* Active internments */}
          {activeInternments.length > 0 && (
            <div className="card card--no-hover" style={{ gridColumn: '1 / -1' }}>
              <div className="card__header">
                <span className="card__title">Pacientes internados</span>
                <button className="btn btn--subtle btn--sm" onClick={() => navigate('/internments')}>Ver todos</button>
              </div>
              <div>
                {activeInternments.map(intern => {
                  const pet = pets.find(intern.petId)
                  const owner = owners.find(intern.ownerId)
                  const isCritical = intern.status === 'critical'
                  const days = Math.round((new Date() - new Date(intern.admissionDate)) / 86400000)
                  return (
                    <div
                      key={intern.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 20px', borderBottom: '1px solid var(--border)',
                        cursor: 'pointer', transition: 'background var(--t-fast)',
                        borderLeft: `3px solid ${isCritical ? 'var(--red)' : 'transparent'}`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => navigate('/internments')}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--r-sm)',
                        background: isCritical ? 'rgba(255,59,48,0.12)' : 'rgba(255,159,10,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isCritical ? 'var(--red)' : 'var(--orange)', flexShrink: 0,
                      }}>
                        <SpeciesIcon species={pet?.species} size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">
                          {pet?.name || '—'}
                          <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 6, fontSize: 13 }}>
                            · {owner?.name || '—'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="truncate">{intern.reason}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <Badge color={isCritical ? 'red' : 'orange'} dot>
                          {isCritical ? 'Crítico' : 'Internado'}
                        </Badge>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                          {days === 0 ? 'Ingresó hoy' : `${days} día${days !== 1 ? 's' : ''}`}
                          {intern.cage ? ` · ${intern.cage}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent sales */}
          <div className="card card--no-hover" style={{ gridColumn: '1 / -1' }}>
            <div className="card__header">
              <span className="card__title">Ventas recientes</span>
              <button className="btn btn--subtle btn--sm" onClick={() => navigate('/sales')}>Ver todas</button>
            </div>
            {recentSales.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <div className="empty-state__icon"><ShoppingCart size={36} strokeWidth={1.5} /></div>
                <div className="empty-state__title" style={{ fontSize: 15 }}>Sin ventas registradas</div>
              </div>
            ) : (
              <div>
                {recentSales.map(sale => {
                  const owner = owners.find(sale.ownerId)
                  return (
                    <div
                      key={sale.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background var(--t-fast)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => navigate('/sales')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">
                          {owner?.name || 'Sin dueño'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(sale.date)}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--vet-teal)' }}>{formatCurrency(sale.total || 0)}</div>
                        <Badge color={sale.paymentStatus === 'paid' ? 'green' : sale.paymentStatus === 'partial' ? 'orange' : 'red'} dot>
                          {{ paid: 'Pagado', partial: 'Parcial', pending: 'Pendiente' }[sale.paymentStatus] || sale.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
