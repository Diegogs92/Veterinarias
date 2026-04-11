import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Scale, ShoppingCart, Lock, Pencil, Trash2, Banknote } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { formatDate, formatCurrency, todayStr } from '../../utils/helpers'

const EMPTY_MOVEMENT = { type: 'income', category: '', description: '', amount: '', date: todayStr() }

const CATEGORIES = {
  income:  ['Consultas', 'Productos', 'Vacunas', 'Cirugías', 'Internación', 'Otros ingresos'],
  expense: ['Insumos médicos', 'Alimentos', 'Personal', 'Servicios', 'Alquiler', 'Mantenimiento', 'Impuestos', 'Otros gastos'],
}

export default function FinancesPage() {
  const { cash, sales } = useApp()
  const { canViewFinances } = useAuth()
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState(EMPTY_MOVEMENT)
  const [errors, setErrors] = useState({})
  const [typeFilter, setTypeFilter] = useState('')

  if (!canViewFinances) {
    return (
      <>
        <Header title="Caja / Finanzas" />
        <div className="page">
          <div className="alert alert--danger" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span>No tenés permiso para ver esta sección. Solo el veterinario puede acceder a las finanzas.</span>
          </div>
        </div>
      </>
    )
  }

  const filtered = useMemo(() =>
    cash.items
      .filter(m => !typeFilter || m.type === typeFilter)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [cash.items, typeFilter]
  )

  const totalIncome  = cash.items.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0)
  const totalExpense = cash.items.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0)
  const balance      = totalIncome - totalExpense
  const salesIncome  = sales.items.reduce((s, m) => s + m.price, 0)

  const setF = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.description.trim()) errs.description = 'Requerido'
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Monto válido requerido'
    if (!form.date) errs.date = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const data = { ...form, amount: parseFloat(form.amount) }
    if (editing) cash.update(editing.id, data)
    else cash.add(data)
    setEditing(null); setFormOpen(false); setForm(EMPTY_MOVEMENT)
  }

  const openEdit = (item) => { setEditing(item); setForm({ ...item, amount: String(item.amount) }); setFormOpen(true) }
  const openNew  = () => { setEditing(null); setForm(EMPTY_MOVEMENT); setErrors({}); setFormOpen(true) }
  const handleDelete = () => { cash.remove(deleting.id); setDeleting(null) }

  return (
    <>
      <Header
        title="Caja / Finanzas"
        subtitle="Solo visible para veterinarios"
        actions={<button className="btn btn--primary" onClick={openNew}>+ Registrar movimiento</button>}
      />
      <div className="page">
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
              <TrendingUp size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Ingresos registrados</div>
            <div className="stat-card__value" style={{ color: 'var(--green)', fontSize: 18 }}>{formatCurrency(totalIncome)}</div>
            <div className="stat-card__sub">en caja manual</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(255,59,48,0.12)', color: 'var(--red)' }}>
              <TrendingDown size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Egresos</div>
            <div className="stat-card__value" style={{ color: 'var(--red)', fontSize: 18 }}>{formatCurrency(totalExpense)}</div>
            <div className="stat-card__sub">{cash.items.filter(m => m.type === 'expense').length} movimientos</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: balance >= 0 ? 'rgba(0,122,255,0.12)' : 'rgba(255,59,48,0.12)', color: balance >= 0 ? 'var(--blue)' : 'var(--red)' }}>
              <Scale size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Balance</div>
            <div className="stat-card__value" style={{ color: balance >= 0 ? 'var(--blue)' : 'var(--red)', fontSize: 18 }}>
              {formatCurrency(balance)}
            </div>
            <div className="stat-card__sub">{balance >= 0 ? 'Positivo' : 'Negativo'}</div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/sales')}>
            <div className="stat-card__icon" style={{ background: 'rgba(175,82,222,0.12)', color: 'var(--purple)' }}>
              <ShoppingCart size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Total ventas</div>
            <div className="stat-card__value" style={{ color: 'var(--purple)', fontSize: 18 }}>{formatCurrency(salesIncome)}</div>
            <div className="stat-card__sub">Ver módulo ventas →</div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="two-col-grid" style={{ marginBottom: 20 }}>
          {['income', 'expense'].map(type => {
            const items = cash.items.filter(m => m.type === type)
            const cats = {}
            items.forEach(m => { cats[m.category || 'Sin categoría'] = (cats[m.category || 'Sin categoría'] || 0) + m.amount })
            const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1])
            const total = items.reduce((s, m) => s + m.amount, 0)
            return (
              <div key={type} className="card card--no-hover">
                <div className="card__header">
                  <span className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {type === 'income'
                      ? <TrendingUp size={15} strokeWidth={2} style={{ color: 'var(--green)' }} />
                      : <TrendingDown size={15} strokeWidth={2} style={{ color: 'var(--red)' }} />
                    }
                    {type === 'income' ? 'Ingresos por categoría' : 'Egresos por categoría'}
                  </span>
                </div>
                <div className="card__body">
                  {sorted.length === 0 ? (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Sin datos</p>
                  ) : sorted.map(([cat, amount]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{cat}</div>
                        <div style={{ height: 6, borderRadius: 3, background: type === 'income' ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.10)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${total > 0 ? (amount / total) * 100 : 0}%`, background: type === 'income' ? 'var(--green)' : 'var(--red)', borderRadius: 3 }} />
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, marginLeft: 12, flexShrink: 0 }}>{formatCurrency(amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="tabs" style={{ display: 'inline-flex' }}>
            <button className={`tab${typeFilter === '' ? ' active' : ''}`} onClick={() => setTypeFilter('')}>Todos</button>
            <button className={`tab${typeFilter === 'income' ? ' active' : ''}`} onClick={() => setTypeFilter('income')}>Ingresos</button>
            <button className={`tab${typeFilter === 'expense' ? ' active' : ''}`} onClick={() => setTypeFilter('expense')}>Egresos</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Banknote size={48} strokeWidth={1.25} />}
            title="Sin movimientos"
            action={<button className="btn btn--primary" onClick={openNew}>+ Registrar movimiento</button>}
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th style={{ textAlign: 'right' }}>Monto</th><th></th></tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontSize: 13 }}>{formatDate(m.date)}</td>
                      <td><Badge color={m.type === 'income' ? 'green' : 'red'} dot>{m.type === 'income' ? 'Ingreso' : 'Egreso'}</Badge></td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.category || '—'}</td>
                      <td className="truncate" style={{ maxWidth: 240 }}>{m.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: m.type === 'income' ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                        {m.type === 'expense' ? '− ' : '+ '}{formatCurrency(m.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn--subtle btn--sm btn--icon" onClick={() => openEdit(m)}><Pencil size={14} strokeWidth={2} /></button>
                          <button className="btn btn--subtle btn--sm btn--icon" onClick={() => setDeleting(m)}><Trash2 size={14} strokeWidth={2} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(EMPTY_MOVEMENT) }}
        title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => { setFormOpen(false); setEditing(null) }}>Cancelar</button>
            <button className="btn btn--primary" onClick={handleSave}>{editing ? 'Guardar' : 'Registrar'}</button>
          </>
        }
      >
        <div className="form-row form-row--2">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-input" value={form.type} onChange={setF('type')}>
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date} onChange={setF('date')} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="form-input" value={form.category} onChange={setF('category')}>
            <option value="">Seleccionar categoría...</option>
            {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Descripción *</label>
          <input className={`form-input${errors.description ? ' form-input--error' : ''}`} value={form.description} onChange={setF('description')} placeholder="Descripción del movimiento..." />
          {errors.description && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.description}</span>}
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Monto (ARS) *</label>
          <input className={`form-input${errors.amount ? ' form-input--error' : ''}`} type="number" min="0" step="100" value={form.amount} onChange={setF('amount')} placeholder="0" />
          {errors.amount && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.amount}</span>}
        </div>
      </Modal>

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar movimiento"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>¿Eliminar <strong>{deleting?.description}</strong>?</p>
      </Modal>
    </>
  )
}
