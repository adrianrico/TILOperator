/**
 * Extrae el mensaje de error que devuelve el backend: `{ message }` (módulo forwarder)
 * o `{ error: { message } }` (auth y errores globales de TIL_Backend).
 * @param {unknown} err - Error de axios.
 * @param {string} [fallback] - Texto si la respuesta no trae mensaje.
 * @returns {string | undefined}
 */
export function backendMessage(err, fallback) {
  return err?.response?.data?.error?.message ?? err?.response?.data?.message ?? fallback
}
