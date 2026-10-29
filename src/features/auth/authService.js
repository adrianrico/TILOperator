import api from '../../shared/api/client'

/** Llamadas HTTP de autenticación. */
export const authService = {
  /** Inicia sesión con la CURP del operador. Responde `{ data: { accessToken, operator } }`. */
  login: (curp) => api.post('/operator-auth/login', { curp }),
}
