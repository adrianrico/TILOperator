import api from './api'

export const rutasService = {
  readAll: () => api.get('/routes/route'),
}
