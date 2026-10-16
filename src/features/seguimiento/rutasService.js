import api from '../../shared/api/client'

/** Llamadas HTTP de rutas (solo lectura: el operador consume rutas, no las define). */
export const rutasService = {
  /** Todas las rutas. Responde `{ routes_data }`. */
  readAll: () => api.get('/routes/route'),
}
