import { test, expect } from '@playwright/test'

const CURP = 'GORA900101HDFXXX01'

test.describe('Login', () => {
  test('CURP válido inicia sesión y navega a la lista de maniobras', async ({ page }) => {
    await page.route('**/operator-auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            accessToken: 'test-token',
            operator: {
              operator_id: CURP,
              operator_name: 'JUAN OPERADOR',
              transporter_id: 'TR001',
              transporter_name: 'TRANSPORTES DEMO',
            },
          },
        }),
      })
    })
    await page.route('**/maneuvers/byOperator/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '1', maneuvers_data: [] }),
      })
    })

    await page.goto('/login')
    await page.getByPlaceholder(/GORA900101/).fill(CURP)
    await page.getByRole('button', { name: 'Ingresar' }).click()

    await expect(page.getByText('Bienvenido, JUAN OPERADOR')).toBeVisible()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Mis maniobras' })).toBeVisible()
  })

  test('CURP inválido muestra error y no navega', async ({ page }) => {
    await page.route('**/operator-auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'CURP no encontrado.' } }),
      })
    })

    await page.goto('/login')
    await page.getByPlaceholder(/GORA900101/).fill('NOEXISTECURPXXXXX')
    await page.getByRole('button', { name: 'Ingresar' }).click()

    await expect(page.getByText('No se pudo iniciar sesión')).toBeVisible()
    await expect(page.getByText('CURP no encontrado.')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
})
