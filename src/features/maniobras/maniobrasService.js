import api from '../../shared/api/client'

/** Llamadas HTTP de maniobras. */
export const maniobrasService = {
  /** Maniobras asignadas al operador autenticado. Responde `{ maneuvers_data }`. */
  getMine:        () => api.get('/maneuvers/byOperator/'),
  /** Guarda ubicación y estatus actuales: `{ man_id, man_current_location, man_current_status }`. */
  updateLocation: (data) => api.patch('/maneuvers/updateLocation/', data),
}
