import axios from 'axios'
import { getBrowserTimezone } from '../lib/utils'

const apiBaseUrl = import.meta.env.VITE_API_URL

if (!apiBaseUrl) {
  throw new Error('VITE_API_URL must be configured before starting the client')
}

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '').endsWith('/api/v1')
  ? apiBaseUrl.replace(/\/$/, '')
  : `${apiBaseUrl.replace(/\/$/, '')}/api/v1`

const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})
// ── Request interceptor — attach JWT + timezone header ────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Timezone'] = getBrowserTimezone()
  return config
})

// ── Response interceptor — handle 401 + refresh token rotation ───────────────
let isRefreshing = false
let pendingQueue = []

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const requestUrl = original?.url ?? ''
    const isAuthRequest = /\/auth\/(login|register|refresh|logout)/.test(requestUrl)
    const canRefresh = error.response?.status === 401 && !isAuthRequest && !original?._retry

    // Recover from expired or otherwise stale access tokens on protected requests.
    if (canRefresh) {
      if (isRefreshing) {
        // Queue requests that arrive while refresh is in progress
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefresh)
        processQueue(null, accessToken)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
