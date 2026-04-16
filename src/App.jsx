import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'

import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OwnersPage from './pages/owners/OwnersPage'
import PetsPage from './pages/pets/PetsPage'
import PetDetail from './pages/pets/PetDetail'
import AppointmentsPage from './pages/appointments/AppointmentsPage'
import ConsultationsPage from './pages/consultations/ConsultationsPage'
import VaccinesPage from './pages/vaccines/VaccinesPage'
import SalesPage from './pages/sales/SalesPage'
import FinancesPage from './pages/finances/FinancesPage'
import InternmentsPage from './pages/internments/InternmentsPage'
import CatalogPage from './pages/catalog/CatalogPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<Layout />}>
                <Route path="/"              element={<Dashboard />} />
                <Route path="/owners"        element={<OwnersPage />} />
                <Route path="/pets"          element={<PetsPage />} />
                <Route path="/pets/:id"      element={<PetDetail />} />
                <Route path="/appointments"  element={<AppointmentsPage />} />
                <Route path="/consultations" element={<ConsultationsPage />} />
                <Route path="/vaccines"      element={<VaccinesPage />} />
                <Route path="/sales"         element={<SalesPage />} />
                <Route path="/finances"      element={<FinancesPage />} />
                <Route path="/internments"  element={<InternmentsPage />} />
                <Route path="/catalog"      element={<CatalogPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
