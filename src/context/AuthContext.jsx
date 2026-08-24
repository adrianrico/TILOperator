import { createContext, useContext, useState } from 'react'
import { authService } from '../services/authService'

const CURP_STORAGE_KEY = 'til_operator_curp'
const OPERATOR_STORAGE_KEY = 'til_operator_data'

const AuthContext = createContext(null)

function loadStoredOperator() {
  try {
    const raw = localStorage.getItem(OPERATOR_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [operator, setOperator] = useState(loadStoredOperator)

  async function login(curp) {
    const res = await authService.login(curp)
    const data = res.data?.operator
    localStorage.setItem(CURP_STORAGE_KEY, data.operator_id)
    localStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify(data))
    setOperator(data)
    return data
  }

  function logout() {
    localStorage.removeItem(CURP_STORAGE_KEY)
    localStorage.removeItem(OPERATOR_STORAGE_KEY)
    setOperator(null)
  }

  return (
    <AuthContext.Provider value={{ operator, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
