# Guía: construir TIL OPERATOR desde cero

Esta guía explica los conceptos clave y recorre, paso a paso y con ejemplos, cómo construir un proyecto igual a este: una app React que consume una API REST, con login, lista, detalle editable, tests y deploy. Cada paso incluye el *porqué*, no solo el *cómo*.

---

## Índice

1. [Qué construimos](#1-qué-construimos)
2. [Conceptos clave](#2-conceptos-clave)
3. [Paso 0 · Requisitos](#paso-0--requisitos)
4. [Paso 1 · Crear el proyecto](#paso-1--crear-el-proyecto)
5. [Paso 2 · Estructura por features](#paso-2--estructura-por-features)
6. [Paso 3 · Cliente HTTP](#paso-3--cliente-http-axios)
7. [Paso 4 · Servicios por dominio](#paso-4--servicios-por-dominio)
8. [Paso 5 · React Query](#paso-5--react-query-datos-del-servidor)
9. [Paso 6 · Autenticación](#paso-6--autenticación-context--ruta-protegida)
10. [Paso 7 · Tema y providers](#paso-7--tema-ant-design-y-providers)
11. [Paso 8 · Enrutado y code splitting](#paso-8--enrutado-y-code-splitting)
12. [Paso 9 · Página de login](#paso-9--página-de-login)
13. [Paso 10 · Lista (tabla/tarjetas)](#paso-10--lista-tablatarjetas-responsive)
14. [Paso 11 · Detalle editable](#paso-11--detalle-editable-seguimiento)
15. [Paso 12 · Lógica pura en utils](#paso-12--lógica-pura-testeable)
16. [Paso 13 · Estilos globales](#paso-13--estilos-globales)
17. [Paso 14 · Lint y tests E2E](#paso-14--lint-y-tests-e2e)
18. [Paso 15 · Deploy en Render](#paso-15--deploy-en-render)
19. [Errores comunes](#errores-comunes)
20. [Ejercicios](#ejercicios-para-practicar)

---

## 1. Qué construimos

**TIL OPERATOR** es una app para operadores de transporte:

1. El operador entra con su **CURP**.
2. Ve sus **maniobras** (viajes) asignadas, ordenadas por urgencia.
3. Abre una maniobra y ve su **ruta** (origen → paradas → destino) como un stepper.
4. En cada punto elige un **evento** (p. ej. "CARGA") y un **subevento**, y **guarda**; el backend actualiza la ubicación y el estatus.

Flujo de pantallas:

```
/login  ──(CURP válida)──▶  /  (lista)  ──(clic en fila)──▶  /maniobras/:manId (seguimiento)
   ▲                                                                   │
   └─────────────────────────── Salir ◀────────────────────────────────┘
```

El frontend **no tiene base de datos**: habla con un backend REST (`VITE_API_URL`).

---

## 2. Conceptos clave

### 2.1 SPA (Single Page Application)
El navegador descarga una sola página HTML y JavaScript la actualiza sin recargar. React dibuja la interfaz; **React Router** cambia "pantallas" según la URL sin pedir otro HTML al servidor.
> Consecuencia: el servidor estático debe devolver `index.html` para *cualquier* ruta (por eso `public/_redirects` y la regla `rewrite` en `render.yaml`). Sin eso, recargar en `/maniobras/123` daría 404.

### 2.2 Vite
Herramienta de desarrollo y build. En desarrollo sirve módulos ES nativos (arranque instantáneo + HMR: los cambios se ven sin recargar). En producción empaqueta y minimiza a `dist/`.
- Variables de entorno: solo las que empiezan con `VITE_` llegan al navegador, vía `import.meta.env.VITE_API_URL`.
- **Nunca** pongas secretos en `VITE_*`: son públicas en el bundle.

### 2.3 Componentes, props, estado, efectos
- **Componente:** función que recibe `props` y devuelve JSX.
- **Estado (`useState`):** datos que, al cambiar, vuelven a renderizar el componente.
- **Efecto (`useEffect`):** sincronizar React con algo *externo* (eventos del navegador, suscripciones). No es para calcular datos derivados: eso se hace durante el render (`useMemo` o variables normales).
- **Hook propio (`useXxx`):** función que reutiliza lógica con hooks (ej. `useIsDesktop`).

### 2.4 Estado del servidor vs. estado de UI
Dos tipos de datos muy distintos:

| | Estado de UI | Estado del servidor |
|---|---|---|
| Ejemplo | pestaña abierta, texto del input | lista de maniobras |
| Dueño | el navegador | el backend |
| Herramienta | `useState`, Context | **React Query** |
| Problemas | pocos | caché, loading, errores, refetch, invalidación |

Mezclarlos (guardar la respuesta de la API en `useState` + `useEffect`) produce código largo y con bugs. React Query resuelve el segundo tipo.

### 2.5 React Query en 3 ideas
1. **`useQuery({ queryKey, queryFn })`**: lee datos. La `queryKey` es la identidad en caché; dos componentes con la misma key comparten datos y una sola petición.
2. **`useMutation({ mutationFn })`**: escribe datos (POST/PATCH/DELETE).
3. **`invalidateQueries({ queryKey })`**: marca datos como viejos tras una mutación; se vuelven a pedir solos.

### 2.6 Context API
Pasa datos a muchos componentes sin "prop drilling". Aquí `AuthContext` expone el operador y `login/logout`. Úsalo para datos globales poco cambiantes (sesión, tema), no para datos de servidor.

### 2.7 Rutas protegidas
Un componente `RequireAuth` envuelve rutas privadas: si no hay sesión, `<Navigate to="/login" />`; si hay, `<Outlet />` pinta la ruta hija. Es **solo UX**: la seguridad real la impone el backend.

### 2.8 Autenticación de este proyecto
Sencilla a propósito: la CURP es la "credencial". Se guarda en `localStorage` y un **interceptor de axios** la añade como header `X-Operator-Curp` a cada petición. El backend la resuelve a un operador. Sin tokens ni expiración. (En un sistema con datos sensibles usarías JWT/cookies HttpOnly.)

### 2.9 Arquitectura por features
Organizar por **dominio de negocio** (auth, maniobras, seguimiento) y no por tipo técnico (components/, pages/, services/).

```
Por tipo (escala mal)          Por feature (escala bien)
components/  (todo mezclado)   features/maniobras/  página + servicio + hook + utils
pages/                         features/auth/
services/                      shared/  (solo lo realmente común)
```
Ventajas: lo que cambia junto vive junto; borrar un feature es borrar una carpeta; se ve qué hace la app con solo abrir `features/`.

**Regla de dependencias:** `app → features → shared`. `shared` nunca importa de `features`. Esto evita ciclos y mantiene `shared` reutilizable.

### 2.10 Capas dentro de un feature
```
Página (UI)  →  Hook (React Query)  →  Servicio (axios)  →  Backend
 *Page.jsx       use*.js               *Service.js
```
- **Servicio:** funciones que solo hacen HTTP. Sin React.
- **Hook:** envuelve el servicio con caché (`useQuery`).
- **Página:** pinta y maneja interacción.
- **Utils/lib:** funciones puras (fechas, transformación) fáciles de probar.

### 2.11 Code splitting (`React.lazy`)
Cada pantalla se descarga solo cuando se visita → el primer arranque es más liviano. Requiere `<Suspense fallback>`.

### 2.12 Responsive sin JavaScript
Para alternar tabla (escritorio) / tarjetas (móvil) se renderizan ambas y **CSS** (`@media`) oculta una. Más simple que escuchar el tamaño de ventana. Se usa JS (`useIsDesktop`) solo cuando una *prop* de un componente depende del tamaño (orientación del `Steps`).

### 2.13 Tests E2E
Playwright abre un navegador real y actúa como usuario. Para no depender del backend se **intercepta la red** (`page.route`) y se responde con datos falsos. Prueban flujos completos (login → lista → guardar).

---

## Paso 0 · Requisitos

- Node.js ≥ 20 (`node -v`), npm, Git.
- Editor (VS Code). Conocer JavaScript moderno (módulos, async/await, destructuring).
- Un backend con estos endpoints (o uno simulado):

| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/auth/login` `{curp}` | `{ operator: { operator_id, operator_name } }` |
| GET | `/maneuvers/byOperator/` | `{ maneuvers_data: [...] }` |
| PATCH | `/maneuvers/updateLocation/` | actualiza ubicación/estatus |
| GET | `/routes/route` | `{ routes_data: [...] }` |

## Paso 1 · Crear el proyecto

```bash
npm create vite@latest til-operator -- --template react
cd til-operator
npm install
npm install antd @ant-design/icons @tanstack/react-query axios dayjs react-router-dom
npm install -D @playwright/test oxlint
npm run dev
```

`.env.example` (se versiona) y `.env.development` (local, ignorado por git):
```
VITE_API_URL=http://localhost:8080
```
`.gitignore` debe ignorar `node_modules`, `dist`, `.env.*` (salvo `.env.example`) y `test-results`.

**Comprueba:** abre `http://localhost:5173` y ves la plantilla de Vite.

## Paso 2 · Estructura por features

Borra la demo de Vite (`App.css`, `assets/`, logos) y crea:

```bash
mkdir -p src/app src/features/{auth,maniobras,seguimiento} \
         src/shared/{api,components,lib,styles}
```

Resultado final:
```
src/
├─ main.jsx
├─ app/        App.jsx · AppLayout.jsx · queryClient.js · theme.js
├─ features/
│  ├─ auth/        AuthContext.jsx · LoginPage.jsx · RequireAuth.jsx · authService.js
│  ├─ maniobras/   ManiobrasPage.jsx · CountdownTag.jsx · countdown.js
│  │               maniobrasService.js · useMyManiobras.js
│  └─ seguimiento/ SeguimientoPage.jsx · routeEvents.js · rutasService.js · useIsDesktop.js
└─ shared/
   ├─ api/client.js
   ├─ components/  TILLogo · GlobalLoader · WaveBackground
   ├─ lib/         toast.js · backendMessage.js · storage.js
   └─ styles/index.css
```

## Paso 3 · Cliente HTTP (axios)

Una única instancia configurada. **Por qué:** URL base, timeout y headers en un solo lugar.

`src/shared/lib/storage.js` — claves de `localStorage` centralizadas (evita strings duplicados que se desincronizan):
```js
export const CURP_STORAGE_KEY = 'til_operator_curp'
export const OPERATOR_STORAGE_KEY = 'til_operator_data'
```

`src/shared/api/client.js`:
```js
import axios from 'axios'
import { CURP_STORAGE_KEY } from '../lib/storage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://mi-backend.onrender.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: corre antes de CADA request.
api.interceptors.request.use((config) => {
  const curp = localStorage.getItem(CURP_STORAGE_KEY)
  if (curp) config.headers['X-Operator-Curp'] = curp
  return config
})

export default api
```

## Paso 4 · Servicios por dominio

Cada feature declara sus llamadas HTTP; **no** usan React.

`src/features/maniobras/maniobrasService.js`:
```js
import api from '../../shared/api/client'

export const maniobrasService = {
  getMine:        () => api.get('/maneuvers/byOperator/'),
  updateLocation: (data) => api.patch('/maneuvers/updateLocation/', data),
}
```
Igual para `authService` (`login`) y `rutasService` (`readAll`).

Helpers de errores y avisos en `shared/lib`:
```js
// backendMessage.js
export const backendMessage = (err, fallback) => err?.response?.data?.message ?? fallback
```
`toast.js` envuelve `notification` de antd con `success(msg)` y `error(msg, err)`; así todas las pantallas avisan igual.

## Paso 5 · React Query (datos del servidor)

`src/app/queryClient.js`:
```js
import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})
```
- `retry: 1` → un reintento si falla la red.
- `staleTime: 30000` → durante 30 s los datos se consideran frescos (sin pedir de nuevo).

Hook compartido (lo usan lista y detalle; **misma key = misma caché**):
```js
// features/maniobras/useMyManiobras.js
import { useQuery } from '@tanstack/react-query'
import { maniobrasService } from './maniobrasService'

export const MY_MANIOBRAS_KEY = ['mis-maniobras']

export function useMyManiobras() {
  return useQuery({
    queryKey: MY_MANIOBRAS_KEY,
    queryFn: () => maniobrasService.getMine().then(r => r.data?.maneuvers_data ?? []),
  })
}
```
Exportar la key evita escribir `['mis-maniobras']` en varios archivos (un typo rompería la invalidación en silencio).

Uso:
```jsx
const { data = [], isLoading, isError } = useMyManiobras()
```

## Paso 6 · Autenticación (Context + ruta protegida)

`features/auth/AuthContext.jsx`:
```jsx
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Función inicializadora: lee localStorage UNA vez, al montar.
  const [operator, setOperator] = useState(loadStoredOperator)

  async function login(curp) {
    const res = await authService.login(curp)
    const data = res.data?.operator
    localStorage.setItem(CURP_STORAGE_KEY, data.operator_id)
    localStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify(data))
    setOperator(data)
    return data
  }
  function logout() { /* removeItem x2 + setOperator(null) */ }

  return <AuthContext.Provider value={{ operator, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```
`loadStoredOperator` usa `try/catch` porque `JSON.parse` falla si el valor está corrupto.

`RequireAuth.jsx`:
```jsx
export default function RequireAuth() {
  const { operator } = useAuth()
  if (!operator) return <Navigate to="/login" replace />
  return <Outlet />
}
```
`replace` evita que "atrás" del navegador regrese a la pantalla protegida.

## Paso 7 · Tema Ant Design y providers

`app/theme.js` exporta `antdLocale` (español) y `antdTheme` (algoritmo oscuro + *tokens* de color). `main.jsx`:
```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={antdLocale} theme={antdTheme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
```
`StrictMode` renderiza dos veces en desarrollo para destapar efectos mal escritos; no afecta producción.

Orden de providers en `App.jsx` (de afuera hacia adentro): `QueryClientProvider` → `AuthProvider` → `BrowserRouter`. `AuthProvider` va dentro de Query porque `login` se usa con `useMutation`.

## Paso 8 · Enrutado y code splitting

`app/App.jsx`:
```jsx
const LoginPage       = lazy(() => import('../features/auth/LoginPage'))
const ManiobrasPage   = lazy(() => import('../features/maniobras/ManiobrasPage'))
const SeguimientoPage = lazy(() => import('../features/seguimiento/SeguimientoPage'))

<Suspense fallback={null}>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<RequireAuth />}>          {/* guardia */}
      <Route element={<AppLayout />}>           {/* header + <Outlet/> */}
        <Route index element={<ManiobrasPage />} />
        <Route path="maniobras/:manId" element={<SeguimientoPage />} />
      </Route>
    </Route>
  </Routes>
</Suspense>
```
Rutas anidadas: `RequireAuth` y `AppLayout` no tienen `path`; solo agrupan. `:manId` se lee con `useParams()`.

`app/AppLayout.jsx` pinta el header y `<Outlet />` (donde aparece la página hija).

## Paso 9 · Página de login

Patrón: formulario + `useMutation` + toast + navegación.
```jsx
const loginMutation = useMutation({
  mutationFn: () => login(curp.trim()),
  onSuccess: (op) => { toast.success(`Bienvenido, ${op.operator_name}`); navigate('/', { replace: true }) },
  onError:   (err) => toast.error('No se pudo iniciar sesión', err),
})
```
Detalles útiles:
- `onChange={e => setCurp(e.target.value.toUpperCase())}` normaliza mientras escribe.
- `maxLength={18}` (longitud de una CURP).
- `loading={loginMutation.isPending}` bloquea doble envío.

## Paso 10 · Lista (tabla/tarjetas responsive)

`ManiobrasPage.jsx`:
1. `useMyManiobras()` trae los datos.
2. `useMemo` ordena por urgencia (copia con `[...data]`; **nunca** mutes `data` de React Query):
```js
const sorted = useMemo(
  () => [...(data ?? [])].sort((a, b) => remainingMs(a.man_dispatch_date) - remainingMs(b.man_dispatch_date)),
  [data],
)
```
3. Estados de UI: `isError` → `<Alert>`; vacío → `<Empty>`; cargando → `loading` de la `Table`.
4. Se renderizan `<Table>` y tarjetas; el CSS alterna cuál se ve:
```css
.til-op-list-table { display: none; }
.til-op-list-cards { display: block; }
@media (min-width: 768px) {
  .til-op-list-table { display: block; }
  .til-op-list-cards { display: none; }
}
```

Lógica de fechas pura (`countdown.js`) con dayjs:
```js
export function remainingMs(dispatchDate) {
  const target = dayjs(dispatchDate, 'YYYY-MM-DD', true) // true = parseo estricto
  if (!dispatchDate || !target.isValid()) return Infinity
  return target.startOf('day').valueOf() - dayjs().startOf('day').valueOf()
}
```
Se compara **inicio de día** con inicio de día para evitar errores por horas. `Infinity` hace que sin fecha se ordene al final.

## Paso 11 · Detalle editable (seguimiento)

`SeguimientoPage.jsx` combina todo lo anterior:

**1. Leer datos.** Maniobras (misma caché que la lista) + rutas; la maniobra se busca por `manId`:
```js
const record = maniobras.find(m => m.man_id === manId) ?? null
```
**2. Derivar puntos.** `buildPointMap(record, rutas)` (puro, `routeEvents.js`) devuelve `[{label, value, events}]`. Se memoiza con `useMemo`.

**3. Estado local de selección:** `{ location, status, subevent }`. Se rehidrata desde el servidor con un `useEffect` cuando cambia la maniobra guardada.

**4. Interacción.** Elegir punto reinicia evento y subevento; elegir evento reinicia subevento:
```js
const selectLocation = (p) => setSelection({ location: p.value, status: '', subevent: '' })
const selectEvent    = (name) => setSelection(s => ({ ...s, status: name, subevent: '' }))
```
**5. Guardar.** El estatus viaja como `"EVENTO"` o `"EVENTO / SUBEVENTO"`:
```js
const sentStatus = selection.status && selection.subevent
  ? `${selection.status} / ${selection.subevent}` : selection.status
```
El botón se deshabilita si no hay cambios (`unchanged`), no hay evento o el punto no tiene eventos.

**6. Mutación + refresco:**
```js
const locationMutation = useMutation({
  mutationFn: (d) => maniobrasService.updateLocation(d),
  onSuccess: () => {
    toast.success('Ubicación actualizada')
    queryClient.invalidateQueries({ queryKey: MY_MANIOBRAS_KEY }) // refresca lista y detalle
  },
  onError: (err) => toast.error('Error al actualizar la ubicación', err),
})
```
**7. Orden de hooks.** Todos los hooks van **antes** de cualquier `return` condicional (loading / no encontrado). Si no, rompes las reglas de los hooks (y el lint `rules-of-hooks` lo marca).

**8. Responsive con JS:** `useIsDesktop()` escucha `matchMedia` y cambia `direction` del `Steps`.

## Paso 12 · Lógica pura testeable

`routeEvents.js` contiene funciones sin React: `isCancelado`, `normalizeEvents`, `parseManStatus`, `normalizeLegacyRoute`, `buildPointMap`. Ejemplo:
```js
parseManStatus('CARGA / SUB A')  // { event: 'CARGA', subevent: 'SUB A' }
parseManStatus('CARGA')          // { event: 'CARGA', subevent: '' }
parseManStatus(null)             // { event: '', subevent: '' }
```
**Idea clave:** saca la lógica del componente. Se entiende mejor, se reutiliza y se prueba sin navegador. `normalizeLegacyRoute` es un *adaptador*: convierte datos viejos al formato nuevo para que el resto del código maneje un solo formato.

## Paso 13 · Estilos globales

`shared/styles/index.css` (importado en `main.jsx`):
- Reset básico y fondo con gradientes.
- *Overrides* de antd con clases `.ant-*` (necesitan `!important` porque antd usa CSS-in-JS con alta especificidad).
- Clases propias con prefijo (`til-op-*`, `maylob-toast`) para no chocar con antd.
- Media queries de layout (`.til-op-header`, `.til-op-content`).

Tip: usa estilos inline para valores dinámicos y CSS para media queries/hover (el inline no admite `@media`).

## Paso 14 · Lint y tests E2E

**Oxlint** (`.oxlintrc.json`): `react/rules-of-hooks` en *error* detecta hooks mal usados.
```bash
npm run lint
```

**Playwright** (`playwright.config.js`): levanta `npm run dev` y prueba en Chromium.
```js
test('login válido lleva a la lista', async ({ page }) => {
  // Se intercepta la red: el test no necesita backend.
  await page.route('**/auth/login', route =>
    route.fulfill({ json: { operator: { operator_id: 'CURP1', operator_name: 'Ana' } } }))

  await page.goto('/login')
  await page.getByPlaceholder(/GORA/).fill('CURP1')
  await page.getByRole('button', { name: /ingresar/i }).click()
  await expect(page).toHaveURL('/')
})
```
Consejos:
- Usa selectores por **rol/texto** (lo que ve el usuario), no por clases internas.
- Si un texto aparece dos veces (error "strict mode violation") acota el selector: `page.locator('.ant-steps-item-title').getByText('ORIGEN')`.
- `npm test` corre todo; `npx playwright test --ui` es el modo visual para depurar.

## Paso 15 · Deploy en Render

`render.yaml` define un **Static Site**:
```yaml
services:
  - type: web
    name: til-operator
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://mi-backend.onrender.com
    routes:
      - type: rewrite        # necesario para SPA
        source: /*
        destination: /index.html
```
1. Sube el repo a GitHub.
2. En Render: *New → Blueprint* y selecciona el repo.
3. Cada `git push` a `main` redepliega.

> `VITE_API_URL` se **incrusta en el build**: si la cambias, hay que volver a construir.

---

## Errores comunes

| Síntoma | Causa | Solución |
|---|---|---|
| 404 al recargar `/maniobras/1` en producción | Falta rewrite SPA | `routes` en `render.yaml` / `_redirects` |
| `import.meta.env.VITE_API_URL` es `undefined` | Variable sin prefijo `VITE_` o servidor sin reiniciar | Renombrar y reiniciar `npm run dev` |
| Lista no se actualiza tras guardar | No se invalidó la query | `invalidateQueries({ queryKey })` con la **misma** key |
| "Rendered more hooks than previous render" | Hook después de un `return` condicional | Mover todos los hooks arriba |
| CORS en el navegador | El backend no permite tu origen | Configurar CORS en el backend (no se arregla en el front) |
| Estilos de antd no cambian | Especificidad | Selector más específico o `!important` |
| Datos de React Query "mutados" | `data.sort()` modifica la caché | Copia: `[...data].sort()` |

## Ejercicios para practicar

1. **Fácil:** agrega un campo "Transportista" a la tarjeta de maniobra.
2. **Fácil:** muestra el nombre del operador en el `Login` tras un error 401 con el mensaje del backend.
3. **Medio:** filtra la lista por estatus con un `Select` (estado local + `useMemo`).
4. **Medio:** añade un botón "Refrescar" que llame `refetch()` de `useMyManiobras`.
5. **Medio:** escribe tests unitarios (Vitest) de `countdownLabel` y `parseManStatus`.
6. **Difícil:** sustituye la CURP por un token JWT: el login guarda el token y el interceptor envía `Authorization: Bearer`; un interceptor de *response* hace logout en 401.
7. **Difícil:** migra el proyecto a TypeScript (`.tsx`) tipando las respuestas de la API.

---

### Resumen en una frase

> **UI** en `*Page.jsx` → **datos** con React Query en hooks → **HTTP** en servicios sobre un cliente axios único → **lógica pura** en utils → todo organizado **por feature**, con código común en `shared`.
