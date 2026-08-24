import axios from 'axios'

const CURP_STORAGE_KEY = 'til_operator_curp'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://maylob-backend.onrender.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Identifies the operator on every request - the backend resolves it back to a
// name/transporter via resolveOperator middleware. This is the whole "session":
// no token, no expiry, just the CURP the operator logged in with.
api.interceptors.request.use((config) => {
  const curp = localStorage.getItem(CURP_STORAGE_KEY)
  if (curp) {
    config.headers['X-Operator-Curp'] = curp
  }
  return config
})

export default api
