import axios from 'axios'
import api from './client'

export const authApi = {
  register: (email, password) =>
    axios.post('/api/v1/auth/register', { email, password }).then((r) => r.data.data),

  login: (email, password) =>
    axios.post('/api/v1/auth/login', { email, password }).then((r) => r.data.data),

  refresh: (refreshToken) =>
    axios.post('/api/v1/auth/refresh', { refreshToken }).then((r) => r.data.data),

  logout: (refreshToken) =>
    axios.post('/api/v1/auth/logout', { refreshToken }),

  me: () => api.get('/auth/me').then((r) => r.data.data),
}
