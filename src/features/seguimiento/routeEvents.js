/**
 * Utilidades de rutas y eventos (portadas de til_forwarder: mismo modelo
 * ruta/evento/subevento del backend). Solo lectura: TIL OPERATOR consume rutas, no las define.
 *
 * Modelo: una ruta tiene origen, puntos intermedios y destino; cada punto tiene `events[]`
 * y cada evento `sub_events[]`. El operador elige un punto, un evento y un subevento.
 */

/** `true` si el nombre del evento es "cancelado" (sin importar mayúsculas/espacios). */
export function isCancelado(name) {
  return (name ?? '').toString().trim().toLowerCase() === 'cancelado'
}

/**
 * Quita eventos "cancelado" (la UI agrega el suyo propio) y normaliza los subeventos.
 * @param {Array} events
 * @returns {{ event_name: string, sub_events: string[] }[]}
 */
export function normalizeEvents(events) {
  return (events ?? [])
    .filter(e => e.event_name && !isCancelado(e.event_name))
    .map(e => ({ event_name: e.event_name, sub_events: (e.sub_events ?? []).filter(Boolean) }))
}

/**
 * `man_current_status` se guarda como "evento" o "evento / subevento"; lo separa de nuevo
 * para precargar la selección de evento y subevento por separado.
 * @param {string} [raw]
 * @returns {{ event: string, subevent: string }}
 */
export function parseManStatus(raw) {
  if (!raw) return { event: '', subevent: '' }
  const idx = raw.indexOf(' / ')
  if (idx === -1) return { event: raw, subevent: '' }
  return { event: raw.slice(0, idx), subevent: raw.slice(idx + 3) }
}

/**
 * Convierte rutas con formato antiguo al formato actual. Las rutas viejas guardan
 * `route_origin`/`route_destination` como texto, sus eventos en `route_origin_events`/
 * `route_destination_events` y los intermedios en `route_intermediate_stops {stop_name, stop_events}`.
 * Se reconstruye `{ location_name, events[] }` para que rutas legacy (y los snapshots dentro de
 * las maniobras) muestren sus eventos; las rutas actuales pasan sin cambios.
 */
export function normalizeLegacyRoute(route) {
  if (!route || typeof route.route_origin !== 'string') return route
  const stops = (route.route_intermediate_stops ?? []).filter(s => s?.stop_name)
  return {
    ...route,
    route_origin:              { location_name: route.route_origin,      events: route.route_origin_events ?? [] },
    route_intermediate_points: stops.map(s => ({ location_name: s.stop_name, events: s.stop_events ?? [] })),
    route_destination:         { location_name: route.route_destination, events: route.route_destination_events ?? [] },
  }
}

/**
 * Lista ordenada de puntos (origen, intermedios, destino) de la ruta de una maniobra, cada uno
 * con sus eventos. Orden de resolución de la ruta (igual al `update_location` del backend):
 *   1. ruta viva (puntos/eventos frescos) buscada por `man_route.route_id`;
 *   2. el snapshot embebido en la maniobra (la ruta se borró después de vincularla);
 *   3. ruta con mismo origen/destino, para maniobras viejas nunca vinculadas.
 * @param {object} record - Maniobra.
 * @param {object[]} [rutas] - Rutas vivas del backend.
 * @returns {{ label: string, value: string, events: object[] }[]}
 */
export function buildPointMap(record, rutas = []) {
  const route = normalizeLegacyRoute(
    (record.man_route?.route_id ? rutas.find(r => r.route_id === record.man_route.route_id) : null) ??
    record.man_route ??
    rutas.map(normalizeLegacyRoute).find(
      r => r.route_origin?.location_name      === record.man_load_location &&
           r.route_destination?.location_name === record.man_unload_location
    ) ??
    null
  )

  const points = []
  const seen   = new Set()

  const push = (name, events) => {
    if (!name || seen.has(name)) return
    seen.add(name)
    points.push({ label: name, value: name, events: normalizeEvents(events) })
  }

  const originName = route?.route_origin?.location_name      || record.man_load_location
  const destName    = route?.route_destination?.location_name || record.man_unload_location
  const stops       = route?.route_intermediate_points?.length
    ? route.route_intermediate_points
    : (record.man_intermediate_stops ?? [])

  push(originName, route?.route_origin?.events)
  for (const stop of stops) {
    const name = stop.location_name ?? stop.stop_name
    if (name) push(name, stop.events ?? stop.stop_events)
  }
  push(destName, route?.route_destination?.events)

  return points
}
