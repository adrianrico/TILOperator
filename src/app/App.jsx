import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import AppLayout from './AppLayout'
import { AuthProvider } from '../features/auth/AuthContext'
import RequireAuth from '../features/auth/RequireAuth'
import GlobalLoader from '../shared/components/GlobalLoader'
import WaveBackground from '../shared/components/WaveBackground'

// Cada pantalla se descarga bajo demanda (code splitting) para un primer arranque más ligero.
const LoginPage       = lazy(() => import('../features/auth/LoginPage'))
const ManiobrasPage   = lazy(() => import('../features/maniobras/ManiobrasPage'))
const SeguimientoPage = lazy(() => import('../features/seguimiento/SeguimientoPage'))

/**
 * Raíz de la aplicación: proveedores globales + tabla de rutas.
 *
 *   /login               pública
 *   /                    lista de maniobras        (requiere sesión)
 *   /maniobras/:manId    seguimiento de una maniobra (requiere sesión)
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WaveBackground />
        <GlobalLoader />
        <BrowserRouter>
          <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<ManiobrasPage />} />
                <Route path="maniobras/:manId" element={<SeguimientoPage />} />
              </Route>
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
