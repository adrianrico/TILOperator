import { useEffect, useState } from 'react'

/**
 * `true` cuando el ancho de ventana es >= `breakpoint` px; se actualiza al redimensionar.
 * Sirve para cambiar la orientación del `Steps` (horizontal/vertical).
 * @param {number} [breakpoint=768]
 */
export function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : true
  )
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const handler = e => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isDesktop
}
