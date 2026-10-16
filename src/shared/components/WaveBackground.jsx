import { useEffect, useRef } from 'react'

/**
 * Capas de olas del fondo. `parallax` es la fracción del scroll que desplaza cada capa
 * (más grande = se mueve más); `duration`/`delay` controlan la animación CSS en segundos.
 */
const WAVES = [
  { color: 'rgba(6,89,186,0.13)',   height: 220, duration: 22, delay: 0,   parallax: 0.04 },
  { color: 'rgba(6,149,228,0.09)',  height: 320, duration: 15, delay: -7,  parallax: 0.09 },
  { color: 'rgba(0,120,220,0.07)',  height: 400, duration: 19, delay: -11, parallax: 0.15 },
  { color: 'rgba(6,149,228,0.05)',  height: 490, duration: 12, delay: -4,  parallax: 0.22 },
]

/** Una capa de ola: dos SVG idénticos en fila que la animación CSS `wave-strip` desliza en bucle. */
function WaveLayer({ color, height, duration, delay, containerRef }) {
  const mid  = height * 0.50
  const high = height * 0.15
  const low  = height * 0.85
  const d = `M0,${mid} C180,${high} 360,${low} 540,${mid} C720,${high} 900,${low} 1080,${mid} C1260,${high} 1440,${low} 1440,${mid} L1440,${height} L0,${height} Z`

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, willChange: 'transform' }}
    >
      <div className="wave-strip" style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}>
        {[0, 1].map(i => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 1440 ${height}`}
            preserveAspectRatio="none"
            style={{ display: 'block', width: '50%', height, flexShrink: 0 }}
          >
            <path d={d} fill={color} />
          </svg>
        ))}
      </div>
    </div>
  )
}

/** Fondo animado de olas con efecto parallax al hacer scroll. Decorativo (sin eventos de puntero). */
export default function WaveBackground() {
  // Un ref por capa, en el mismo orden que WAVES.
  const layerRefs = useRef([])

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        layerRefs.current.forEach((el, i) => {
          if (el) el.style.transform = `translateY(${-y * WAVES[i].parallax}px)`
        })
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {WAVES.map((w, i) => (
        <WaveLayer key={i} {...w} containerRef={(el) => { layerRefs.current[i] = el }} />
      ))}
    </div>
  )
}
