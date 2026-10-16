import { useQuery } from '@tanstack/react-query'
import { maniobrasService } from './maniobrasService'

/** Clave de caché compartida; invalídala tras modificar una maniobra. */
export const MY_MANIOBRAS_KEY = ['mis-maniobras']

/**
 * Maniobras del operador autenticado.
 * Lo usan la lista y el seguimiento: React Query comparte la caché entre ambos.
 */
export function useMyManiobras() {
  return useQuery({
    queryKey: MY_MANIOBRAS_KEY,
    queryFn:  () => maniobrasService.getMine().then(r => r.data?.maneuvers_data ?? []),
  })
}
