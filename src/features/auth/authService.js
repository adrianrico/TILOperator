import api from '../../shared/api/client'

/** Llamadas HTTP de autenticación. */
export const authService = {
  /** Inicia sesión con la CURP del operador. Responde `{ operator }`. */
  login: (curp) => api.post('/auth/login', { curp }),
}
