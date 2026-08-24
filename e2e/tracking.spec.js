import { test, expect } from '@playwright/test'

const CURP = 'GORA900101HDFXXX01'

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const MANEUVER = {
  man_id: 'M001',
  man_client: 'CLI01',
  man_dispatch_date: tomorrow(),
  man_load_location: 'ORIGEN',
  man_unload_location: 'DESTINO',
  man_current_location: '',
  man_current_status: '',
  man_progress: '0%',
  man_containers: [{ container_id: 'CONT001' }],
  man_route: {
    route_id: 'R1',
    route_origin: {
      location_name: 'ORIGEN',
      events: [
        { event_name: 'cancelado', sub_step_number: 0, sub_events: [] },
        { event_name: 'CARGA', sub_step_number: 1, sub_events: ['SUB A', 'SUB B'] },
      ],
    },
    route_destination: {
      location_name: 'DESTINO',
      events: [
        { event_name: 'cancelado', sub_step_number: 0, sub_events: [] },
        { event_name: 'DESCARGA', sub_step_number: 1, sub_events: [] },
      ],
    },
    route_intermediate_points: [],
  },
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(([curp, operator]) => {
    localStorage.setItem('til_operator_curp', curp)
    localStorage.setItem('til_operator_data', JSON.stringify(operator))
  }, [CURP, { operator_id: CURP, operator_name: 'JUAN OPERADOR', transporter_id: 'TR001', transporter_name: 'TRANSPORTES DEMO' }])

  await page.route('**/maneuvers/byOperator/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: '1', maneuvers_data: [MANEUVER] }),
    })
  })
  await page.route('**/routes/route', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: '1', routes_data: [] }),
    })
  })
})

test('actualizar ubicación/evento/subevento de una maniobra asignada', async ({ page }) => {
  let capturedBody = null
  await page.route('**/maneuvers/updateLocation/', async (route) => {
    capturedBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: '1', message: 'Ubicación actualizada correctamente.', man_progress: '25%' }),
    })
  })

  await page.goto('/maniobras/M001')

  await expect(page.getByText('CONT001')).toBeVisible()

  // Selecciona el punto de ubicación "ORIGEN" en el Steps...
  await page.getByText('ORIGEN', { exact: true }).click()

  // Selecciona el evento "CARGA" en el Timeline...
  await page.getByText('CARGA', { exact: true }).click()

  // Selecciona el sub-evento "SUB A"...
  await page.getByText('SUB A', { exact: true }).click()

  const saveButton = page.getByRole('button', { name: 'Guardar actualización' })
  await expect(saveButton).toBeEnabled()
  await saveButton.click()

  await expect(page.getByText('Ubicación actualizada')).toBeVisible()

  expect(capturedBody).toMatchObject({
    man_id: 'M001',
    man_current_location: 'ORIGEN',
    man_current_status: 'CARGA / SUB A',
  })
})
