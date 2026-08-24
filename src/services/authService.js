import api from './api'

export const authService = {
  login: (curp) => api.post('/auth/login', { curp }),
}
