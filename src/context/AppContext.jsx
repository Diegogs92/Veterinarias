import { createContext, useContext, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { generateId } from '../utils/helpers'
import {
  INITIAL_OWNERS, INITIAL_PETS, INITIAL_APPOINTMENTS,
  INITIAL_CONSULTATIONS, INITIAL_VACCINES, INITIAL_SALES, INITIAL_CASH,
  INITIAL_INTERNMENTS, INITIAL_PRODUCT_CATEGORIES, INITIAL_PRODUCTS,
  INITIAL_DEBTS, INITIAL_DEBT_PAYMENTS,
} from '../data/initialData'

const AppContext = createContext(null)

function useCrud(storageKey, initial) {
  const [items, setItems] = useLocalStorage(storageKey, initial)

  const add = (data) => {
    const item = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    setItems(prev => [...prev, item])
    return item
  }

  const update = (id, data) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i))
  }

  const remove = (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const find = (id) => items.find(i => i.id === id)

  return { items, setItems, add, update, remove, find }
}

export function AppProvider({ children }) {
  const owners            = useCrud('vet_owners',             INITIAL_OWNERS)
  const pets              = useCrud('vet_pets',               INITIAL_PETS)
  const appointments      = useCrud('vet_appointments',       INITIAL_APPOINTMENTS)
  const consultations     = useCrud('vet_consultations',      INITIAL_CONSULTATIONS)
  const vaccines          = useCrud('vet_vaccines',           INITIAL_VACCINES)
  const sales             = useCrud('vet_sales_v2',           INITIAL_SALES)
  const cash              = useCrud('vet_cash',               INITIAL_CASH)
  const internments       = useCrud('vet_internments',        INITIAL_INTERNMENTS)
  const productCategories = useCrud('vet_product_categories', INITIAL_PRODUCT_CATEGORIES)
  const products          = useCrud('vet_products',           INITIAL_PRODUCTS)
  const debts             = useCrud('vet_debts',              INITIAL_DEBTS)
  const debtPayments      = useCrud('vet_debt_payments',      INITIAL_DEBT_PAYMENTS)

  // ── Internment helpers ────────────────────────────────────────────────────

  const addDailyNote = (internmentId, noteText) => {
    const note = { id: generateId(), date: new Date().toISOString(), note: noteText, createdAt: new Date().toISOString() }
    internments.setItems(prev => prev.map(i =>
      i.id === internmentId
        ? { ...i, dailyNotes: [...(i.dailyNotes || []), note], updatedAt: new Date().toISOString() }
        : i
    ))
  }

  const removeDailyNote = (internmentId, noteId) => {
    internments.setItems(prev => prev.map(i =>
      i.id === internmentId
        ? { ...i, dailyNotes: (i.dailyNotes || []).filter(n => n.id !== noteId) }
        : i
    ))
  }

  // ── Debt helpers ──────────────────────────────────────────────────────────

  /**
   * Crea o actualiza la deuda asociada a una venta o consulta.
   * Si la fuente queda como 'paid', elimina o marca como pagada la deuda.
   */
  const syncDebt = (sourceType, sourceId, ownerId, totalAmount, paidAmount) => {
    const paid = paidAmount || 0
    const status = paid >= totalAmount ? 'paid' : paid > 0 ? 'partial' : 'pending'

    debts.setItems(prev => {
      const existing = prev.find(d => d.sourceId === sourceId && d.sourceType === sourceType)
      if (existing) {
        if (status === 'paid') {
          // Deuda saldada: actualizar como pagada (no eliminar para historial)
          return prev.map(d =>
            d.sourceId === sourceId && d.sourceType === sourceType
              ? { ...d, totalAmount, paidAmount: paid, status: 'paid', updatedAt: new Date().toISOString() }
              : d
          )
        }
        return prev.map(d =>
          d.sourceId === sourceId && d.sourceType === sourceType
            ? { ...d, totalAmount, paidAmount: paid, status, updatedAt: new Date().toISOString() }
            : d
        )
      } else if (status !== 'paid') {
        const newDebt = {
          id: generateId(),
          ownerId,
          sourceType,
          sourceId,
          totalAmount,
          paidAmount: paid,
          status,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        }
        return [...prev, newDebt]
      }
      return prev
    })
  }

  /**
   * Registra un pago sobre una deuda y actualiza el saldo.
   * El monto no puede superar el saldo pendiente.
   */
  const registerDebtPayment = (debtId, amount, date, notes) => {
    debts.setItems(prev => {
      const debt = prev.find(d => d.id === debtId)
      if (!debt) return prev
      const newPaid = Math.min((debt.paidAmount || 0) + amount, debt.totalAmount)
      const status  = newPaid >= debt.totalAmount ? 'paid' : 'partial'

      debtPayments.add({ debtId, ownerId: debt.ownerId, amount, date, notes })

      return prev.map(d =>
        d.id === debtId
          ? { ...d, paidAmount: newPaid, status, updatedAt: new Date().toISOString() }
          : d
      )
    })
  }

  return (
    <AppContext.Provider value={{
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
