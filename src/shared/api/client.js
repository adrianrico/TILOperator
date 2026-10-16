import axios from 'axios'
import { TOKEN_STORAGE_KEY, OPERATOR_STORAGE_KEY } from '../lib/storage'

/**
 * Cliente HTTP único de la aplicación (axios).
 * La URL base viene de `VITE_API_URL` (ver `.env.example`).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://maylob-backend.onrender.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/** Adjunta el JWT del operador (`Authorization: Bearer`) emitido por `/auth/login`. */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Token vencido o inválido: se limpia la sesión y se vuelve al login.
 * El login mismo (`/auth/login`) se excluye para no recargar al fallar una CURP.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? ''
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(OPERATOR_STORAGE_KEY)
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default api
