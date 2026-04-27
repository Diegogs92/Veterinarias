import { createContext, useContext, useState, useEffect, useRef } from 'react'
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
    const payload = objToSnake(item, ['updatedAt', ...omit])
    setItems(prev => [...prev, item])
    supabase.from(table).insert(payload)
      .then(({ error }) => {
        if (error) {
          console.error(`[${table}] insert error:`, error.message, '\nPayload:', JSON.stringify(payload))
          setItems(prev => prev.filter(i => i.id !== item.id))
          alert(`❌ Error al guardar (${table}):\n${error.message}`)
        }
      })
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
  const _sales            = useSupaCrud('sales', ['items'])
  const cash              = useSupaCrud('cash_movements')
  const internments       = useSupaCrud('internments', ['dailyNotes'])
  const productCategories = useSupaCrud('product_categories')
  const products          = useSupaCrud('products')
  const debts             = useSupaCrud('debts')
  const debtPayments      = useSupaCrud('debt_payments')
  const grooming          = useSupaCrud('grooming_sessions')
  const boarding          = useSupaCrud('boarding')
  const consultas         = useSupaCrud('consultas')
  const cirugias          = useSupaCrud('cirugias')

  // ── Stable setters refs (nunca cambian, evitan stale closures) ───────────
  const setOwners   = useRef(owners.setItems)
  const setPets     = useRef(pets.setItems)
  const setSales    = useRef(_sales.setItems)
  const setCash     = useRef(cash.setItems)
  const setIntern   = useRef(internments.setItems)
  const setProdCats = useRef(productCategories.setItems)
  const setProds    = useRef(products.setItems)
  const setDebts    = useRef(debts.setItems)
  const setDebtPays = useRef(debtPayments.setItems)
  const setGrooming = useRef(grooming.setItems)
  const setBoarding = useRef(boarding.setItems)
  const setConsultas= useRef(consultas.setItems)
  const setCirugias = useRef(cirugias.setItems)

  // ── Data fetcher ─────────────────────────────────────────────────────────
  const fetchAll = async () => {
    const [o, p, s, cm, im, pc, pr, d, dp, gr, bo, co, ci] = await Promise.all([
      supabase.from('owners').select('*'),
      supabase.from('pets').select('*'),
      supabase.from('sales').select('*, sale_items(*)'),
      supabase.from('cash_movements').select('*'),
      supabase.from('internments').select('*, internment_notes(*)'),
      supabase.from('product_categories').select('*'),
      supabase.from('products').select('*'),
      supabase.from('debts').select('*'),
      supabase.from('debt_payments').select('*'),
      supabase.from('grooming_sessions').select('*'),
      supabase.from('boarding').select('*'),
      supabase.from('consultas').select('*'),
      supabase.from('cirugias').select('*'),
    ])
    if (o.data)  setOwners.current(convRows(o.data))
    if (p.data)  setPets.current(convRows(p.data))
    if (s.data)  setSales.current(s.data.map(row => { const { sale_items: si, ...rest } = row; return { ...objToCamel(rest), items: (si || []).map(objToCamel) } }))
    if (cm.data) setCash.current(convRows(cm.data))
    if (im.data) setIntern.current(im.data.map(row => { const { internment_notes: notes, ...rest } = row; return { ...objToCamel(rest), dailyNotes: (notes || []).map(objToCamel) } }))
    if (pc.data) setProdCats.current(convRows(pc.data))
    if (pr.data) setProds.current(convRows(pr.data))
    if (d.data)  setDebts.current(convRows(d.data))
    if (dp.data) setDebtPays.current(convRows(dp.data))
    if (gr.data) setGrooming.current(convRows(gr.data))
    if (bo.data) setBoarding.current(convRows(bo.data))
    if (co.data) setConsultas.current(convRows(co.data))
    if (ci.data) setCirugias.current(convRows(ci.data))
  }

  // Ref que apunta siempre a la versión más reciente de fetchAll
  const fetchAllRef = useRef(fetchAll)
  useEffect(() => { fetchAllRef.current = fetchAll })

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    fetchAllRef.current().catch(e => console.error('Error loading data:', e)).finally(() => setLoading(false))
  }, [currentUser?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-sync: visibilitychange + polling cada 30s ────────────────────────
  useEffect(() => {
    if (!currentUser) return

    const refresh = () => fetchAllRef.current().catch(e => console.error('Auto-sync error:', e))

    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)

    const interval = setInterval(refresh, 30_000)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
  }, [currentUser?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return

    const salesMapper = data => data.map(row => { const { sale_items: si, ...rest } = row; return { ...objToCamel(rest), items: (si || []).map(objToCamel) } })
    const internMapper = data => data.map(row => { const { internment_notes: notes, ...rest } = row; return { ...objToCamel(rest), dailyNotes: (notes || []).map(objToCamel) } })
    const refetch = {
      owners:             () => supabase.from('owners').select('*').then(({ data }) => data && setOwners.current(convRows(data))),
      pets:               () => supabase.from('pets').select('*').then(({ data }) => data && setPets.current(convRows(data))),
      sales:              () => supabase.from('sales').select('*, sale_items(*)').then(({ data }) => data && setSales.current(salesMapper(data))),
      sale_items:         () => supabase.from('sales').select('*, sale_items(*)').then(({ data }) => data && setSales.current(salesMapper(data))),
      cash_movements:     () => supabase.from('cash_movements').select('*').then(({ data }) => data && setCash.current(convRows(data))),
      internments:        () => supabase.from('internments').select('*, internment_notes(*)').then(({ data }) => data && setIntern.current(internMapper(data))),
      internment_notes:   () => supabase.from('internments').select('*, internment_notes(*)').then(({ data }) => data && setIntern.current(internMapper(data))),
      product_categories: () => supabase.from('product_categories').select('*').then(({ data }) => data && setProdCats.current(convRows(data))),
      products:           () => supabase.from('products').select('*').then(({ data }) => data && setProds.current(convRows(data))),
      debts:              () => supabase.from('debts').select('*').then(({ data }) => data && setDebts.current(convRows(data))),
      debt_payments:      () => supabase.from('debt_payments').select('*').then(({ data }) => data && setDebtPays.current(convRows(data))),
      grooming_sessions:  () => supabase.from('grooming_sessions').select('*').then(({ data }) => data && setGrooming.current(convRows(data))),
      boarding:           () => supabase.from('boarding').select('*').then(({ data }) => data && setBoarding.current(convRows(data))),
      consultas:          () => supabase.from('consultas').select('*').then(({ data }) => data && setConsultas.current(convRows(data))),
      cirugias:           () => supabase.from('cirugias').select('*').then(({ data }) => data && setCirugias.current(convRows(data))),
    }

    const channel = supabase.channel('realtime-all')
    Object.keys(refetch).forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => refetch[table]())
    })
    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
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
      if (error) {
        console.error('[sales] insert:', error.message, objToSnake(sale, ['updatedAt']))
        setSales.current(prev => prev.filter(s => s.id !== id))
        alert(`❌ Error al guardar la venta:\n${error.message}`)
        return
      }
      if (saleItems.length) {
        const rows = saleItems.map(item => objToSnake({
          ...item, id: item.id || crypto.randomUUID(), saleId: id,
        }))
        const { error: ie } = await supabase.from('sale_items').insert(rows)
        if (ie) {
          console.error('[sale_items] insert:', ie.message)
          alert(`⚠️ Venta guardada pero error en los productos:\n${ie.message}`)
        }
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
    if (!ownerId) return // venta de mostrador / sin cliente: no se genera deuda
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
      owners, pets,
      sales, cash, internments,
      productCategories, products,
      debts, debtPayments,
      grooming, boarding, consultas, cirugias,
      addDailyNote, removeDailyNote,
      syncDebt, registerDebtPayment,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
