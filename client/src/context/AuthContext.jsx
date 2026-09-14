import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!localStorage.getItem('accessToken')) return null
    const stored = localStorage.getItem('tk_user')
    if (!stored) return null
    try { return JSON.parse(stored) } catch { return null }
  })
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('accessToken')))

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    authApi.me()
      .then((nextUser) => {
        localStorage.setItem('tk_user', JSON.stringify(nextUser))
        setUser(nextUser)
      })
      .catch(() => {
        localStorage.removeItem('tk_user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const tokens = await authApi.login(email, password)
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    const u = await authApi.me()
    localStorage.setItem('tk_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (email, password) => {
    const tokens = await authApi.register(email, password)
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    const u = await authApi.me()
    localStorage.setItem('tk_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('tk_user')
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

