// Ported from til_forwarder (RouteEventsFields.jsx / RutasSeguimiento.jsx) - same
// route/event/sub_event shape the backend already models, read-only here since
// TIL OPERATOR only consumes routes, it never defines them.

export function isCancelado(name) {
  return (name ?? '').toString().trim().toLowerCase() === 'cancelado'
}

// Strips cancelado and normalizes each evento's subeventos for a paso.
export function normalizeEvents(events) {
  return (events ?? [])
    .filter(e => e.event_name && !isCancelado(e.event_name))
    .map(e => ({ event_name: e.event_name, sub_events: (e.sub_events ?? []).filter(Boolean) }))
}

// man_current_status is stored as "evento" or "evento / subevento". Split it back
// apart so the Evento/Subevento selection can be pre-populated independently.
export function parseManStatus(raw) {
  if (!raw) return { event: '', subevent: '' }
  const idx = raw.indexOf(' / ')
  if (idx === -1) return { event: raw, subevent: '' }
  return { event: raw.slice(0, idx), subevent: raw.slice(idx + 3) }
}

// Route assigned to this maniobra: prefer the live route (fresh puntos/eventos, matched
// by man_route.route_id), then the embedded snapshot itself (route deleted since linking),
// then a same-origin/destination match for legacy maniobras never explicitly linked - same
// resolution order the backend's update_location uses.
export function buildPointMap(record, rutas = []) {
  const route =
    (record.man_route?.route_id ? rutas.find(r => r.route_id === record.man_route.route_id) : null) ??
    record.man_route ??
    rutas.find(
      r => r.route_origin?.location_name      === record.man_load_location &&
           r.route_destination?.location_name === record.man_unload_location
    ) ??
    null

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
    if (stop.location_name) push(stop.location_name, stop.events)
  }
  push(destName, route?.route_destination?.events)

  return points
}
