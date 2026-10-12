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

// Routes stored before the stepper restructure keep route_origin / route_destination as plain
// location names, events in route_origin_events / route_destination_events and intermediate
// points in route_intermediate_stops {stop_name, stop_events}. Rebuild the current
// {location_name, events[]} shape so legacy routes (and the snapshots embedded in maniobras)
// render their events; current routes pass through untouched.
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

// Route assigned to this maniobra: prefer the live route (fresh puntos/eventos, matched
// by man_route.route_id), then the embedded snapshot itself (route deleted since linking),
// then a same-origin/destination match for legacy maniobras never explicitly linked - same
// resolution order the backend's update_location uses.
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
