import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import AppLayout from './components/Layout/AppLayout'
import GlobalLoader from './components/GlobalLoader'
import WaveBackground from './components/WaveBackground'
import Login from './pages/Login'
import Maniobras from './pages/Maniobras'
import Seguimiento from './pages/Seguimiento'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WaveBackground />
        <GlobalLoader />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<Maniobras />} />
                <Route path="maniobras/:manId" element={<Seguimiento />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
