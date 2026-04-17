import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// ── Case conversion ──────────────────────────────────────────────────────────
const toSnake = s => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
const toCamel = s => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

function objToSnake(obj, omit = []) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k]) => !omit.includes(k))
      .map(([k, v]) => [toSnake(k), v])
  )
}

function objToCamel(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toCamel(k), v])
  )
}

const convRows = rows => (rows || []).map(r => objToCamel(r))

// ── Generic Supabase CRUD hook ────────────────────────────────────────────────
function useSupaCrud(table, omit = []) {
  const [items, setItems] = useState([])

  const add = (data) => {
    const item = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setItems(prev => [...prev, item])
    supabase.from(table).insert(objToSnake(item, ['updatedAt', ...omit]))
      .then(({ error }) => { if (error) console.error(`[${table}] insert:`, error.message) })
    return item
  }

  const update = (id, data) => {
    const now = new Date().toISOString()
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data, updatedAt: now } : i))
    supabase.from(table).update(objToSnake({ ...data, updatedAt: now }, ['id', 'createdAt', ...omit])).eq('id', id)
      .then(({ error }) => { if (error) console.error(`[${table}] update:`, error.message) })
  }

  const remove = (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    supabase.from(table).delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(`[${table}] delete:`, error.message) })
  }

  const find = (id) => items.find(i => i.id === id)

  return { items, setItems, add, update, remove, find }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)

  const owners            = useSupaCrud('owners')
  const pets              = useSupaCrud('pets')
  const appointments      = useSupaCrud('appointments')
  const consultations     = useSupaCrud('consultations')
  const vaccines          = useSupaCrud('vaccines')
  const _sales            = useSupaCrud('sales', ['items'])
  const cash              = useSupaCrud('cash_movements')
  const internments       = useSupaCrud('internments', ['dailyNotes'])
  const productCategories = useSupaCrud('product_categories')
  const products          = useSupaCrud('products')
  const debts             = useSupaCrud('debts')
  const debtPayments      = useSupaCrud('debt_payments')

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return

    setLoading(true)
    ;(async () => {
      try {
        const [o, p, a, c, v, s, cm, im, pc, pr, d, dp] = await Promise.all([
          supabase.from('owners').select('*'),
          supabase.from('pets').select('*'),
          supabase.from('appointments').select('*'),
          supabase.from('consultations').select('*'),
          supabase.from('vaccines').select('*'),
          supabase.from('sales').select('*, sale_items(*)'),
          supabase.from('cash_movements').select('*'),
          supabase.from('internments').select('*, internment_notes(*)'),
          supabase.from('product_categories').select('*'),
          supabase.from('products').select('*'),
          supabase.from('debts').select('*'),
          supabase.from('debt_payments').select('*'),
        ])

        owners.setItems(convRows(o.data))
        pets.setItems(convRows(p.data))
        appointments.setItems(convRows(a.data))
        consultations.setItems(convRows(c.data))
        vaccines.setItems(convRows(v.data))

        _sales.setItems((s.data || []).map(row => {
          const { sale_items: si, ...rest } = row
          return { ...objToCamel(rest), items: (si || []).map(objToCamel) }
        }))

        cash.setItems(convRows(cm.data))

        internments.setItems((im.data || []).map(row => {
          const { internment_notes: notes, ...rest } = row
          return { ...objToCamel(rest), dailyNotes: (notes || []).map(objToCamel) }
        }))

        productCategories.setItems(convRows(pc.data))
        products.setItems(convRows(pr.data))
        debts.setItems(convRows(d.data))
        debtPayments.setItems(convRows(dp.data))
      } catch (e) {
        console.error('Error loading data:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [currentUser?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sales — special CRUD (items go to sale_items table) ───────────────────
  const addSale = (data) => {
    const { items: saleItems = [], ...saleData } = data
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const sale = { ...saleData, id, createdAt: now }

    _sales.setItems(prev => [...prev, { ...sale, items: saleItems }])

    ;(async () => {
      const { error } = await supabase.from('sales').insert(objToSnake(sale, ['updatedAt']))
      if (error) { console.error('[sales] insert:', error.message); return }
      if (saleItems.length) {
        const rows = saleItems.map(item => objToSnake({
          ...item, id: item.id || crypto.randomUUID(), saleId: id,
        }))
        const { error: ie } = await supabase.from('sale_items').insert(rows)
        if (ie) console.error('[sale_items] insert:', ie.message)
      }
    })()

    return { ...sale, items: saleItems }
  }

  const updateSale = (id, data) => {
    const { items: saleItems, ...saleData } = data
    const now = new Date().toISOString()

    _sales.setItems(prev => prev.map(s =>
      s.id === id ? { ...s, ...saleData, items: saleItems ?? s.items, updatedAt: now } : s
    ))

    ;(async () => {
      const { error } = await supabase.from('sales')
        .update(objToSnake({ ...saleData, updatedAt: now }, ['id', 'createdAt', 'items']))
        .eq('id', id)
      if (error) console.error('[sales] update:', error.message)

      if (saleItems !== undefined) {
        await supabase.from('sale_items').delete().eq('sale_id', id)
        if (saleItems.length) {
          const rows = saleItems.map(item => objToSnake({
            ...item, id: item.id || crypto.randomUUID(), saleId: id,
          }))
          const { error: ie } = await supabase.from('sale_items').insert(rows)
          if (ie) console.error('[sale_items] update:', ie.message)
        }
      }
    })()
  }

  const removeSale = (id) => {
    _sales.setItems(prev => prev.filter(s => s.id !== id))
    supabase.from('sales').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('[sales] delete:', error.message) })
  }

  const sales = {
    items: _sales.items,
    setItems: _sales.setItems,
    add: addSale,
    update: updateSale,
    remove: removeSale,
    find: _sales.find,
  }

  // ── Internment daily notes ─────────────────────────────────────────────────
  const addDailyNote = (internmentId, noteText) => {
    const note = {
      id: crypto.randomUUID(),
      internmentId,
      note: noteText,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    internments.setItems(prev => prev.map(i =>
      i.id === internmentId
        ? { ...i, dailyNotes: [...(i.dailyNotes || []), note], updatedAt: new Date().toISOString() }
        : i
    ))
    supabase.from('internment_notes').insert(objToSnake(note))
      .then(({ error }) => { if (error) console.error('[internment_notes] insert:', error.message) })
  }

  const removeDailyNote = (internmentId, noteId) => {
    internments.setItems(prev => prev.map(i =>
      i.id === internmentId
        ? { ...i, dailyNotes: (i.dailyNotes || []).filter(n => n.id !== noteId) }
        : i
    ))
    supabase.from('internment_notes').delete().eq('id', noteId)
      .then(({ error }) => { if (error) console.error('[internment_notes] delete:', error.message) })
  }

  // ── Debt helpers ──────────────────────────────────────────────────────────
  const syncDebt = (sourceType, sourceId, ownerId, totalAmount, paidAmount) => {
    const paid = paidAmount || 0
    const status = paid >= totalAmount ? 'paid' : paid > 0 ? 'partial' : 'pending'
    const now = new Date().toISOString()

    debts.setItems(prev => {
      const existing = prev.find(d => d.sourceId === sourceId && d.sourceType === sourceType)
      if (existing) {
        return prev.map(d =>
          d.sourceId === sourceId && d.sourceType === sourceType
            ? { ...d, totalAmount, paidAmount: paid, status, updatedAt: now }
            : d
        )
      } else if (status !== 'paid') {
        return [...prev, {
          id: crypto.randomUUID(), ownerId, sourceType, sourceId,
          totalAmount, paidAmount: paid, status,
          date: now.slice(0, 10), createdAt: now,
        }]
      }
      return prev
    })

    // DB sync
    supabase.from('debts').select('id').eq('source_type', sourceType).eq('source_id', sourceId).maybeSingle()
      .then(({ data: existing }) => {
        if (existing) {
          return supabase.from('debts').update({
            total_amount: totalAmount, paid_amount: paid, status, updated_at: now,
          }).eq('id', existing.id)
        } else if (status !== 'paid') {
          return supabase.from('debts').insert({
            id: crypto.randomUUID(),
            owner_id: ownerId, source_type: sourceType, source_id: sourceId,
            total_amount: totalAmount, paid_amount: paid, status,
            date: now.slice(0, 10), created_at: now,
          })
        }
      })
      .then(res => { if (res?.error) console.error('[debts] sync:', res.error.message) })
      .catch(e => console.error('[debts] sync error:', e))
  }

  const registerDebtPayment = (debtId, amount, date, notes) => {
    const debt = debts.items.find(d => d.id === debtId)
    if (!debt) return
    const newPaid = Math.min((debt.paidAmount || 0) + amount, debt.totalAmount)
    const status = newPaid >= debt.totalAmount ? 'paid' : 'partial'
    const now = new Date().toISOString()

    debts.setItems(prev => prev.map(d =>
      d.id === debtId ? { ...d, paidAmount: newPaid, status, updatedAt: now } : d
    ))

    const payment = {
      id: crypto.randomUUID(), debtId, ownerId: debt.ownerId,
      amount, date, notes, createdAt: now,
    }
    debtPayments.setItems(prev => [...prev, payment])

    Promise.all([
      supabase.from('debt_payments').insert(objToSnake(payment)),
      supabase.from('debts').update({ paid_amount: newPaid, status, updated_at: now }).eq('id', debtId),
    ]).then(([r1, r2]) => {
      if (r1.error) console.error('[debt_payments] insert:', r1.error.message)
      if (r2.error) console.error('[debts] payment update:', r2.error.message)
    })
  }

  return (
    <AppContext.Provider value={{
      loading,
      owners, pets, appointments, consultations, vaccines,
      sales, cash, internments,
      productCategories, products,
      debts, debtPayments,
      addDailyNote, removeDailyNote,
      syncDebt, registerDebtPayment,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
