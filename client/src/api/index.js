import api from './client'

export const mealsApi = {
  list: (params) => api.get('/meals', { params }).then((r) => r.data),
  getOne: (id) => api.get(`/meals/${id}`).then((r) => r.data.data),
  create: (data) => api.post('/meals', data).then((r) => r.data.data),
  update: (id, data) => api.patch(`/meals/${id}`, data).then((r) => r.data.data),
  remove: (id) => api.delete(`/meals/${id}`),
}

export const goalsApi = {
  getCurrent: () => api.get('/goals/current').then((r) => r.data.data),
  getHistory: (params) => api.get('/goals/history', { params }).then((r) => r.data),
  create: (data) => api.post('/goals', data).then((r) => r.data.data),
}

export const nutritionApi = {
  weeklyTrend: (params) => api.get('/nutrition/trend/weekly', { params }).then((r) => r.data.data),
  macros: (params) => api.get('/nutrition/macros', { params }).then((r) => r.data.data),
  micros: (params) => api.get('/nutrition/micros/summary', { params }).then((r) => r.data.data),
  goalVsActual: (params) => api.get('/nutrition/goal-vs-actual', { params }).then((r) => r.data.data),
}

export const usersApi = {
  getMe: () => api.get('/users/me').then((r) => r.data.data),
  updateMe: (data) => api.patch('/users/me', data).then((r) => r.data.data),
}

export const aiApi = {
  extract: (file, type) => {
    const form = new FormData()
    form.append('image', file)
    return api
      .post(`/ai/extract?type=${type}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data)
  },
}
