import api from './client'

export const authApi = {
  register: (email, password) =>
    api.post('/auth/register', { email, password }).then((r) => r.data.data),

  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  me: () => api.get('/auth/me').then((r) => r.data.data),
}
