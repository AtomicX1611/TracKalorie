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

export const importsApi = {
  /**
   * Upload a CSV for parsing. Returns rows with validation flags for preview.
   * @param {File} file  - The CSV File object
   */
  parseCsv: (file) => {
    const form = new FormData()
    form.append('csv', file)
    return api
      .post('/imports/csv/parse', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data)
  },

  /**
   * Confirm and bulk-import rows after user review.
   * @param {object[]} rows           - Validated rows from preview
   * @param {string}   defaultDate    - Fallback date (YYYY-MM-DD)
   * @param {string}   defaultMealType - Fallback meal type
   */
  confirmImport: (rows, defaultDate, defaultMealType) =>
    api
      .post('/imports/csv/confirm', { rows, defaultDate, defaultMealType })
      .then((r) => r.data.data),
}
