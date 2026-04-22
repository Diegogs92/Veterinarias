import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'

import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OwnersPetsPage from './pages/owners-pets/OwnersPetsPage'
import PetDetail from './pages/pets/PetDetail'
import SalesPage from './pages/sales/SalesPage'
import FinancesPage from './pages/finances/FinancesPage'
import InternmentsPage from './pages/internments/InternmentsPage'
import CatalogPage from './pages/catalog/CatalogPage'
import UsersPage from './pages/users/UsersPage'
import GroomingPage from './pages/grooming/GroomingPage'
import BoardingPage from './pages/boarding/BoardingPage'
import ConsultasPage from './pages/consultas/ConsultasPage'
import CirugiasPage from './pages/cirugias/CirugiasPage'

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
                <Route path="/owners-pets"   element={<OwnersPetsPage />} />
                <Route path="/pets/:id"      element={<PetDetail />} />
                <Route path="/consultas"     element={<ConsultasPage />} />
                <Route path="/cirugias"     element={<CirugiasPage />} />
                <Route path="/grooming"      element={<GroomingPage />} />
                <Route path="/boarding"      element={<BoardingPage />} />
                <Route path="/sales"         element={<SalesPage />} />
                <Route path="/finances"      element={<FinancesPage />} />
                <Route path="/internments"   element={<InternmentsPage />} />
                <Route path="/catalog"       element={<CatalogPage />} />
                <Route path="/users"         element={<UsersPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
