import { createContext, useContext, useState } from 'react'
import { authService } from './authService'
import { TOKEN_STORAGE_KEY, OPERATOR_STORAGE_KEY } from '../../shared/lib/storage'

const AuthContext = createContext(null)

/** Lee el operador guardado en localStorage (o `null` si no hay o está corrupto). */
function loadStoredOperator() {
  try {
    const raw = localStorage.getItem(OPERATOR_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Provee la sesión del operador a toda la app.
 * Expone `{ operator, login(curp), logout() }` vía `useAuth()`.
 */
export function AuthProvider({ children }) {
  const [operator, setOperator] = useState(loadStoredOperator)

  /** Valida la CURP en el backend y persiste la sesión. Lanza si el backend rechaza. */
  async function login(curp) {
    const res = await authService.login(curp)
    const data = res.data?.operator
    localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token)
    localStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify(data))
    setOperator(data)
    return data
  }

  /** Borra la sesión local. */
  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(OPERATOR_STORAGE_KEY)
    setOperator(null)
  }

  return (
    <AuthContext.Provider value={{ operator, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Accede a la sesión. Solo válido dentro de `<AuthProvider>`. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
