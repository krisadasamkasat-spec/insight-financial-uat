import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Reports from './pages/Reports'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import { ToastProvider } from './components/common/ToastProvider'
import { SettingsProvider } from './contexts/SettingsContext'

function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <div className="app-container">
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectCode" element={<ProjectDetail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </div>
      </ToastProvider>
    </SettingsProvider>
  )
}

export default App
