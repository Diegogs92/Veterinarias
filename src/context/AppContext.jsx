import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { generateId } from '../utils/helpers'
import {
  INITIAL_OWNERS, INITIAL_PETS, INITIAL_APPOINTMENTS,
  INITIAL_CONSULTATIONS, INITIAL_VACCINES, INITIAL_SALES, INITIAL_CASH,
  INITIAL_INTERNMENTS,
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
  const owners       = useCrud('vet_owners',        INITIAL_OWNERS)
  const pets         = useCrud('vet_pets',          INITIAL_PETS)
  const appointments = useCrud('vet_appointments',  INITIAL_APPOINTMENTS)
  const consultations= useCrud('vet_consultations', INITIAL_CONSULTATIONS)
  const vaccines     = useCrud('vet_vaccines',      INITIAL_VACCINES)
  const sales        = useCrud('vet_sales',         INITIAL_SALES)
  const cash         = useCrud('vet_cash',          INITIAL_CASH)
  const internments  = useCrud('vet_internments',   INITIAL_INTERNMENTS)

  // Add a daily note to an internment (without replacing the whole object awkwardly)
  const addDailyNote = (internmentId, noteText) => {
    const note = { id: generateId(), date: new Date().toISOString(), note: noteText, createdAt: new Date().toISOString() }
    internments.update(internmentId, {})  // trigger updatedAt
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

  return (
    <AppContext.Provider value={{ owners, pets, appointments, consultations, vaccines, sales, cash, internments, addDailyNote, removeDailyNote }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
