import api from './api'

export const maniobrasService = {
  getMine:        () => api.get('/maneuvers/byOperator/'),
  updateLocation: (data) => api.patch('/maneuvers/updateLocation/', data),
}
