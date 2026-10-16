import dayjs from 'dayjs'

// man_dispatch_date only stores a day (YYYY-MM-DD, no time) - the countdown compares
// day boundaries in local time, assuming dispatch happens at the start of that day.
/**
 * Milisegundos entre hoy y el día de despacho (negativo = vencida).
 * @param {string} [dispatchDate] - `YYYY-MM-DD`.
 * @returns {number} `Infinity` si la fecha falta o es inválida.
 */
export function remainingMs(dispatchDate) {
  const target = dayjs(dispatchDate, 'YYYY-MM-DD', true)
  if (!dispatchDate || !target.isValid()) return Infinity
  return target.startOf('day').valueOf() - dayjs().startOf('day').valueOf()
}

/**
 * Texto y color de la etiqueta de cuenta regresiva.
 * Colores: rojo vencida, naranja hoy, dorado 1-3 días, verde más de 3.
 * @param {string} [dispatchDate] - `YYYY-MM-DD`.
 * @returns {{ text: string, tone: string | undefined }}
 */
export function countdownLabel(dispatchDate) {
  const ms = remainingMs(dispatchDate)
  if (ms === Infinity) return { text: 'Sin fecha de despacho', tone: undefined }

  const days = Math.round(ms / 86400000)

  if (days < 0) {
    const n = Math.abs(days)
    return { text: `Vencida hace ${n} día${n === 1 ? '' : 's'}`, tone: 'red' }
  }
  if (days === 0) return { text: 'Inicia hoy', tone: 'orange' }
  if (days === 1) return { text: 'Inicia mañana', tone: 'gold' }
  if (days <= 3) return { text: `Inicia en ${days} días`, tone: 'gold' }
  return { text: `Inicia en ${days} días`, tone: 'green' }
}
