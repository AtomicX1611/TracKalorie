import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MealsPage    from './pages/MealsPage'
import GoalsPage    from './pages/GoalsPage'
import ReportsPage  from './pages/ReportsPage'
import AIScannerPage from './pages/AIScannerPage'

// ── Protected route guard ────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin-slow" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

// ── Public route guard (redirect to /dashboard if already logged in) ─────────
function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

          {/* Protected — all inside Layout (sidebar + main) */}
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/meals"     element={<MealsPage />} />
            <Route path="/goals"     element={<GoalsPage />} />
            <Route path="/reports"   element={<ReportsPage />} />
            <Route path="/ai"        element={<AIScannerPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
