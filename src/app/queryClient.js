import { QueryClient } from '@tanstack/react-query'

/**
 * Cliente único de React Query (caché de datos del servidor).
 * - retry: 1 reintento ante fallo de red.
 * - staleTime: 30 s sin refetch automático al volver a montar una pantalla.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})
