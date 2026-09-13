import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

// ── Dummy auth for UI-only mode ───────────────────────────────────────────────
// When backend is live, swap the dummy* blocks with real API calls.

const DUMMY_USER = { userId: '1', email: 'demo@trackalorie.app' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for a stored "session"
    const stored = localStorage.getItem('tk_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch (_) { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, _password) => {
    // TODO: swap with real API: const tokens = await authApi.login(email, password)
    const u = { ...DUMMY_USER, email }
    localStorage.setItem('tk_user', JSON.stringify(u))
    localStorage.setItem('accessToken', 'dummy-access-token')
    localStorage.setItem('refreshToken', 'dummy-refresh-token')
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (email, _password) => {
    // TODO: swap with real API: const tokens = await authApi.register(email, password)
    const u = { ...DUMMY_USER, email }
    localStorage.setItem('tk_user', JSON.stringify(u))
    localStorage.setItem('accessToken', 'dummy-access-token')
    localStorage.setItem('refreshToken', 'dummy-refresh-token')
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tk_user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
