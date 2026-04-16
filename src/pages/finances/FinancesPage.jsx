import { useState, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, Scale, ShoppingCart, Lock,
  Pencil, Trash2, Banknote, Stethoscope, AlertCircle, CheckCircle2, Plus,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { formatDate, formatCurrency, todayStr } from '../../utils/helpers'

const EXPENSE_CATEGORIES = [
  'Insumos médicos', 'Alimentos', 'Personal', 'Servicios',
  'Alquiler', 'Mantenimiento', 'Impuestos', 'Otros gastos',
]

const EMPTY_EXPENSE = { category: '', description: '', amount: '', date: todayStr() }
const EMPTY_PAYMENT = { amount: '', date: todayStr(), notes: '' }

export default function FinancesPage() {
  const { cash, sales, consultations, owners, pets, debts, registerDebtPayment } = useApp()
  const { canViewFinances } = useAuth()

  // Expense modal
  const [expenseOpen, setExpenseOpen]   = useState(false)
  const [editingExp, setEditingExp]     = useState(null)
  const [expForm, setExpForm]           = useState(EMPTY_EXPENSE)
  const [expErrors, setExpErrors]       = useState({})
  const [deletingExp, setDeletingExp]   = useState(null)

  // Debt payment modal
  const [paymentDebt, setPaymentDebt]   = useState(null)  // debt object
  const [payForm, setPayForm]           = useState(EMPTY_PAYMENT)
  const [payErrors, setPayErrors]       = useState({})

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

  // ── Income calculations (auto) ─────────────────────────────────────────────
  const salesIncome  = sales.items
    .filter(s => s.paymentStatus === 'paid' || s.paymentStatus === 'partial')
    .reduce((sum, s) => sum + (s.paidAmount || 0), 0)

  const consultIncome = consultations.items
    .filter(c => c.price > 0 && (c.paymentStatus === 'paid' || c.paymentStatus === 'partial'))
    .reduce((sum, c) => sum + (c.paidAmount || 0), 0)

  const totalIncome = salesIncome + consultIncome

  // ── Debts ──────────────────────────────────────────────────────────────────
  const pendingDebts = useMemo(() =>
    debts.items
      .filter(d => d.status !== 'paid')
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [debts.items]
  )

  // Group by owner
  const debtsByOwner = useMemo(() => {
    const map = {}
    pendingDebts.forEach(d => {
      if (!map[d.ownerId]) map[d.ownerId] = { ownerId: d.ownerId, debts: [] }
      map[d.ownerId].debts.push(d)
    })
    return Object.values(map).map(entry => ({
      ...entry,
      totalDebt: entry.debts.reduce((s, d) => s + d.totalAmount, 0),
      totalPaid: entry.debts.reduce((s, d) => s + (d.paidAmount || 0), 0),
      balance:   entry.debts.reduce((s, d) => s + (d.totalAmount - (d.paidAmount || 0)), 0),
    })).sort((a, b) => b.balance - a.balance)
  }, [pendingDebts])

  // ── Expenses ───────────────────────────────────────────────────────────────
  const expenses = useMemo(() =>
    cash.items
      .filter(m => m.type === 'expense')
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [cash.items]
  )

  const totalExpenses = expenses.reduce((s, m) => s + m.amount, 0)
  const balance       = totalIncome - totalExpenses

  // ── Expense handlers ───────────────────────────────────────────────────────
  const setEF = (field) => (e) => {
    setExpForm(f => ({ ...f, [field]: e.target.value }))
    setExpErrors(er => ({ ...er, [field]: '' }))
  }

  const validateExp = () => {
    const errs = {}
    if (!expForm.description.trim()) errs.description = 'Requerido'
    if (!expForm.amount || parseFloat(expForm.amount) <= 0) errs.amount = 'Monto válido requerido'
    if (!expForm.date) errs.date = 'Requerido'
    return errs
  }

  const handleSaveExpense = () => {
    const errs = validateExp()
    if (Object.keys(errs).length) { setExpErrors(errs); return }
    const data = { ...expForm, type: 'expense', amount: parseFloat(expForm.amount) }
    if (editingExp) cash.update(editingExp.id, data)
    else cash.add(data)
    setEditingExp(null); setExpenseOpen(false); setExpForm(EMPTY_EXPENSE)
  }

  const openEditExp = (item) => {
    setEditingExp(item)
    setExpForm({ category: item.category || '', description: item.description, amount: String(item.amount), date: item.date })
    setExpErrors({})
    setExpenseOpen(true)
  }

  const openNewExp = () => { setEditingExp(null); setExpForm(EMPTY_EXPENSE); setExpErrors({}); setExpenseOpen(true) }

  // ── Debt payment handlers ──────────────────────────────────────────────────
  const setPF = (field) => (e) => {
    setPayForm(f => ({ ...f, [field]: e.target.value }))
    setPayErrors(er => ({ ...er, [field]: '' }))
  }

  const openPayment = (debt) => {
    setPaymentDebt(debt)
    setPayForm(EMPTY_PAYMENT)
    setPayErrors({})
  }

  const handleSavePayment = () => {
    const errs = {}
    const amount = parseFloat(payForm.amount)
    const saldo = paymentDebt.totalAmount - (paymentDebt.paidAmount || 0)
    if (!amount || amount <= 0) errs.amount = 'Ingresá un monto'
    else if (amount > saldo) errs.amount = `El monto no puede superar el saldo (${ formatCurrency(saldo) })`
    if (!payForm.date) errs.date = 'Requerido'
    if (Object.keys(errs).length) { setPayErrors(errs); return }
    registerDebtPayment(paymentDebt.id, amount, payForm.date, payForm.notes)
    setPaymentDebt(null)
  }

  // ── Category breakdown for expenses ───────────────────────────────────────
  const expenseByCat = useMemo(() => {
    const cats = {}
    expenses.forEach(m => { cats[m.category || 'Sin categoría'] = (cats[m.category || 'Sin categoría'] || 0) + m.amount })
    return Object.entries(cats).sort((a, b) => b[1] - a[1])
  }, [expenses])

  // ── Recent income table ────────────────────────────────────────────────────
  const recentIncome = useMemo(() => {
    const salesEntries = sales.items
      .filter(s => s.paidAmount > 0)
      .map(s => ({
        id: s.id, type: 'sale', date: s.date,
        label: `Venta (${owners.find(s.ownerId)?.name || '—'})`,
        amount: s.paidAmount || 0,
        status: s.paymentStatus,
      }))
    const consultEntries = consultations.items
      .filter(c => c.price > 0 && c.paidAmount > 0)
      .map(c => {
        const pet = pets.find(c.petId)
        return {
          id: c.id, type: 'consultation', date: c.date,
          label: `Consulta · ${pet?.name || '—'} (${owners.find(pet?.ownerId)?.name || '—'})`,
          amount: c.paidAmount || 0,
          status: c.paymentStatus,
        }
      })
    return [...salesEntries, ...consultEntries]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20)
  }, [sales.items, consultations.items, owners, pets])

  return (
    <>
      <Header
        title="Caja / Finanzas"
        subtitle="Solo visible para veterinarios"
        actions={
          <button className="btn btn--danger" onClick={openNewExp}>
            <Plus size={16} /> Registrar egreso
          </button>
        }
      />

      <div className="page">

        {/* ── BLOCK 1: Income summary ─────────────────────────────────────── */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
          Ingresos cobrados
        </h2>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-teal)' }}>
              <ShoppingCart size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Ventas cobradas</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-teal)', fontSize: 20 }}>{formatCurrency(salesIncome)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-purple)' }}>
              <Stethoscope size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Consultas cobradas</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-purple)', fontSize: 20 }}>{formatCurrency(consultIncome)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-emerald)' }}>
              <TrendingUp size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Total ingresos</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-emerald)', fontSize: 20 }}>{formatCurrency(totalIncome)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: balance >= 0 ? 'var(--vet-amber)' : 'var(--vet-rose)' }}>
              <Scale size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Balance (ingresos − egresos)</div>
            <div className="stat-card__value" style={{ color: balance >= 0 ? 'var(--vet-amber)' : 'var(--vet-rose)', fontSize: 20 }}>
              {formatCurrency(balance)}
            </div>
          </div>
        </div>

        {/* Recent income table */}
        <div className="card card--no-hover" style={{ marginBottom: 32 }}>
          <div className="card__header">
            <span className="card__title">Últimos cobros</span>
          </div>
          {recentIncome.length === 0 ? (
            <div style={{ padding: '24px 20px', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Aún no hay cobros registrados.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Origen</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Cobrado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncome.map(entry => (
                    <tr key={`${entry.type}-${entry.id}`}>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</td>
                      <td>
                        <Badge color={entry.type === 'sale' ? 'blue' : 'purple'}>
                          {entry.type === 'sale' ? 'Venta' : 'Consulta'}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 13 }} className="truncate">{entry.label}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-emerald)', whiteSpace: 'nowrap' }}>
                        + {formatCurrency(entry.amount)}
                        {entry.status === 'partial' && (
                          <Badge color="orange" style={{ marginLeft: 6 }}>Parcial</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── BLOCK 2: Debts ──────────────────────────────────────────────── */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
          Deudas pendientes
        </h2>
        {debtsByOwner.length === 0 ? (
          <div className="card card--no-hover" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px', color: 'var(--vet-emerald)' }}>
              <CheckCircle2 size={20} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Sin deudas pendientes</span>
            </div>
          </div>
        ) : (
          <div className="card card--no-hover" style={{ marginBottom: 32 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th style={{ textAlign: 'right' }}>Deuda total</th>
                    <th style={{ textAlign: 'right' }}>Pagado</th>
                    <th style={{ textAlign: 'right' }}>Saldo</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {debtsByOwner.map(entry => {
                    const owner = owners.find(entry.ownerId)
                    return (
                      <tr key={entry.ownerId}>
                        <td style={{ fontWeight: 600 }}>{owner?.name || '—'}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatCurrency(entry.totalDebt)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--vet-emerald)' }}>
                          {formatCurrency(entry.totalPaid)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--vet-rose)' }}>
                          {formatCurrency(entry.balance)}
                        </td>
                        <td>
                          {entry.debts.map(d => (
                            <button
                              key={d.id}
                              className="btn btn--subtle btn--sm"
                              style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                              onClick={() => openPayment(d)}
                            >
                              Registrar pago
                            </button>
                          ))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BLOCK 3: Expenses ───────────────────────────────────────────── */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>Egresos</h2>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-rose)' }}>
              <TrendingDown size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Total egresos</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-rose)', fontSize: 20 }}>{formatCurrency(totalExpenses)}</div>
            <div className="stat-card__sub">{expenses.length} movimientos</div>
          </div>
        </div>

        {/* Category breakdown */}
        {expenseByCat.length > 0 && (
          <div className="card card--no-hover" style={{ marginBottom: 20 }}>
            <div className="card__header">
              <span className="card__title">Egresos por categoría</span>
            </div>
            <div className="card__body">
              {expenseByCat.map(([cat, amount]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{cat}</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(244,63,94,0.10)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0}%`, background: 'var(--vet-rose)', borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginLeft: 12, flexShrink: 0 }}>{formatCurrency(amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <EmptyState
            icon={<Banknote size={40} strokeWidth={1.5} />}
            title="Sin egresos"
            text="Usá el botón 'Registrar egreso' para agregar gastos de la veterinaria"
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(m.date)}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.category || '—'}</td>
                      <td className="truncate" style={{ maxWidth: 240 }}>{m.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-rose)', whiteSpace: 'nowrap' }}>
                        − {formatCurrency(m.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn--subtle btn--sm btn--icon" onClick={() => openEditExp(m)}>
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn--subtle btn--sm btn--icon"
                            onClick={() => setDeletingExp(m)}
                            style={{ color: 'var(--vet-rose)' }}
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Expense modal */}
      <Modal
        isOpen={expenseOpen}
        onClose={() => { setExpenseOpen(false); setEditingExp(null); setExpForm(EMPTY_EXPENSE) }}
        title={editingExp ? 'Editar egreso' : 'Registrar egreso'}
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => { setExpenseOpen(false); setEditingExp(null) }}>Cancelar</button>
            <button className="btn btn--primary" onClick={handleSaveExpense}>{editingExp ? 'Guardar' : 'Registrar'}</button>
          </>
        }
      >
        <div className="form-row form-row--2">
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-input" value={expForm.category} onChange={setEF('category')}>
              <option value="">Sin categoría</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input
              className={`form-input${expErrors.date ? ' form-input--error' : ''}`}
              type="date" value={expForm.date} onChange={setEF('date')}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Descripción *</label>
          <input
            className={`form-input${expErrors.description ? ' form-input--error' : ''}`}
            value={expForm.description} onChange={setEF('description')}
            placeholder="Descripción del egreso..."
          />
          {expErrors.description && <span style={{ color: 'var(--red)', fontSize: 12 }}>{expErrors.description}</span>}
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Monto (ARS) *</label>
          <input
            className={`form-input${expErrors.amount ? ' form-input--error' : ''}`}
            type="number" min="0" step="100"
            value={expForm.amount} onChange={setEF('amount')} placeholder="0"
          />
          {expErrors.amount && <span style={{ color: 'var(--red)', fontSize: 12 }}>{expErrors.amount}</span>}
        </div>
      </Modal>

      {/* Delete expense */}
      {deletingExp && (
        <Modal
          isOpen
          onClose={() => setDeletingExp(null)}
          title="Eliminar egreso"
          size="sm"
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setDeletingExp(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => { cash.remove(deletingExp.id); setDeletingExp(null) }}>Eliminar</button>
            </>
          }
        >
          <p style={{ fontSize: 15 }}>¿Eliminar <strong>{deletingExp.description}</strong>?</p>
        </Modal>
      )}

      {/* Debt payment modal */}
      {paymentDebt && (
        <Modal
          isOpen
          onClose={() => setPaymentDebt(null)}
          title="Registrar pago de deuda"
          size="sm"
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setPaymentDebt(null)}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSavePayment}>Registrar pago</button>
            </>
          }
        >
          {/* Debt info */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Deuda total</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(paymentDebt.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ya pagado</span>
              <span style={{ color: 'var(--vet-emerald)', fontWeight: 600 }}>{formatCurrency(paymentDebt.paidAmount || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid var(--border)', paddingTop: 8, fontWeight: 800 }}>
              <span>Saldo pendiente</span>
              <span style={{ color: 'var(--vet-rose)' }}>
                {formatCurrency(paymentDebt.totalAmount - (paymentDebt.paidAmount || 0))}
              </span>
            </div>
          </div>

          <div className="form-row form-row--2">
            <div className="form-group">
              <label className="form-label">Monto a pagar (ARS) *</label>
              <input
                className={`form-input${payErrors.amount ? ' form-input--error' : ''}`}
                type="number" min="0" step="100"
                value={payForm.amount} onChange={setPF('amount')} placeholder="0"
                autoFocus
              />
              {payErrors.amount && <span style={{ color: 'var(--red)', fontSize: 12 }}>{payErrors.amount}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input
                className={`form-input${payErrors.date ? ' form-input--error' : ''}`}
                type="date" value={payForm.date} onChange={setPF('date')}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notas</label>
            <input
              className="form-input"
              value={payForm.notes} onChange={setPF('notes')}
              placeholder="Efectivo, transferencia..."
            />
          </div>
        </Modal>
      )}
    </>
  )
}
