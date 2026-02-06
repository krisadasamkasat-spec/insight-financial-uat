import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'

import Approval from './pages/Approval'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import Management from './pages/Management'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import PrivateRoute from './components/auth/PrivateRoute'
import { ToastProvider } from './components/common/ToastProvider'
import { SettingsProvider } from './contexts/SettingsContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <div className="app-container">
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />

                <Route path="/approval" element={<Approval />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:projectCode" element={<ProjectDetail />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/management" element={<Management />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </div>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
