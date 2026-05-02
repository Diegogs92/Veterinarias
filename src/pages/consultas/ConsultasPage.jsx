import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, Stethoscope, Clock, CheckCircle2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import ConsultaForm from './ConsultaForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

const PAYMENT_METHODS = [
  { value: 'efectivo',        label: 'Efectivo',        surcharge: 0    },
  { value: 'transferencia',   label: 'Transferencia',   surcharge: 0    },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito',  surcharge: 0.05 },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito', surcharge: 0.20 },
]

function PendingBtn({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color var(--t-fast)', color: hovered ? 'var(--ok)' : 'var(--warn)', minWidth: 90, whiteSpace: 'nowrap' }}
    >
      <Clock size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
      {hovered ? 'Cobrar' : 'No pagado'}
    </button>
  )
}

export default function ConsultasPage() {
  const { consultas, pets, owners, syncDebt } = useApp()
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [paying, setPaying]         = useState(null)

  const filtered = useMemo(() =>
    consultas.items
      .filter(c => {
        const pet   = pets.find(c.petId)
        const owner = owners.find(c.ownerId)
        const str   = `${pet?.name || ''} ${owner?.name || ''} ${c.reason} ${c.diagnosis || ''}`.toLowerCase()
        return str.includes(search.toLowerCase()) && (typeFilter === 'all' || c.type === typeFilter)
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [consultas.items, search, typeFilter, pets, owners]
  )

  const handleSave = (data) => {
    let savedId
    if (editing) { consultas.update(editing.id, data); savedId = editing.id }
    else { const created = consultas.add(data); savedId = created.id }
    if (data.price > 0) {
      const pet = pets.find(data.petId)
      if (pet?.ownerId) syncDebt('consulta', savedId, pet.ownerId, data.price, data.paymentStatus === 'paid' ? data.price : 0)
    }
    setEditing(null)
  }

  const handleMarkPaid = (method) => {
    const surchargeAmt = Math.round((paying.price || 0) * method.surcharge)
    consultas.update(paying.id, { paymentStatus: 'paid', paymentMethod: method.value, price: (paying.price || 0) + surchargeAmt })
    setPaying(null)
  }

  const handleDelete = () => {
    if (deleting.price > 0) {
      const pet = pets.find(deleting.petId)
      if (pet?.ownerId) syncDebt('consulta', deleting.id, pet.ownerId, deleting.price, deleting.price)
    }
    consultas.remove(deleting.id)
    setDeleting(null)
  }

  return (
    <>
      <Header
        title="Consultas"
        subtitle={`${consultas.items.length} consulta${consultas.items.length !== 1 ? 's' : ''} registrada${consultas.items.length !== 1 ? 's' : ''}`}
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} className="search-icon" />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar mascota, dueño, motivo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={18} /> Nueva consulta
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div className="tabs">
            {[
              { value: 'all',         label: 'Todas' },
              { value: 'consultorio', label: 'Consultorio' },
              { value: 'domicilio',   label: 'Domicilio' },
            ].map(t => (
              <button key={t.value} className={`tab${typeFilter === t.value ? ' active' : ''}`} onClick={() => setTypeFilter(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={40} strokeWidth={1.5} />}
            title="Sin consultas"
            text={search ? 'No hay consultas que coincidan' : 'Registrá la primera consulta'}
            action={!search
              ? <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus size={18} /> Nueva consulta</button>
              : null
            }
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Mascota</th>
                    <th>Motivo</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Estado</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const pet   = pets.find(c.petId)
                    const owner = owners.find(c.ownerId)
                    const paid  = c.paymentStatus === 'paid'
                    return (
                      <tr key={c.id}>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(c.date)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{pet?.name || '—'}</div>
                          {owner && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{owner.name}</div>}
                        </td>
                        <td style={{ maxWidth: 220 }}>
                          <div style={{ fontSize: 13 }} className="truncate">{c.reason || '—'}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)', whiteSpace: 'nowrap' }}>
                          {c.price > 0 ? formatCurrency(c.price) : '—'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {c.price > 0
                            ? paid
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontSize: 13, fontWeight: 600 }}><CheckCircle2 size={15} strokeWidth={2} />Pagado</span>
                              : <PendingBtn onClick={() => setPaying(c)} />
                            : <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>—</span>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="btn btn--subtle btn--icon" onClick={() => { setEditing(c); setFormOpen(true) }} title="Editar">
                              <Pencil size={18} />
                            </button>
                            <button className="btn btn--subtle btn--icon" onClick={() => setDeleting(c)} title="Eliminar" style={{ color: 'var(--vet-rose)' }}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConsultaForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!paying}
        onClose={() => setPaying(null)}
        title="Registrar pago"
        size="sm"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
          Seleccioná la forma de pago para <strong>{pets.find(paying?.petId)?.name}</strong>:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAYMENT_METHODS.map(m => {
            const surchargeAmt = Math.round((paying?.price || 0) * m.surcharge)
            const total = (paying?.price || 0) + surchargeAmt
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => handleMarkPaid(m)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-sub)', cursor: 'pointer', fontSize: 14, transition: 'all var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-3)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-sub)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <span style={{ fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontWeight: 700, color: m.surcharge > 0 ? 'var(--orange)' : 'var(--accent)' }}>
                  {m.surcharge > 0 && <span style={{ fontWeight: 400, fontSize: 12, marginRight: 6, color: 'var(--orange)' }}>+{m.surcharge * 100}%</span>}
                  {formatCurrency(total)}
                </span>
              </button>
            )
          })}
        </div>
      </Modal>

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar consulta"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar la consulta del {formatDate(deleting?.date)} de <strong>{pets.find(deleting?.petId)?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
