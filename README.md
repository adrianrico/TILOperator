# TIL OPERATOR

App web (móvil y escritorio) para que los operadores de transporte consulten sus maniobras asignadas y reporten su ubicación y estatus en cada punto de la ruta.

- **Stack:** React 19 · Vite · Ant Design 6 · React Router 7 · TanStack Query 5 · Axios
- **Calidad:** Oxlint · Playwright (E2E)
- **Deploy:** Render (sitio estático, ver `render.yaml`)

## Inicio rápido

```bash
npm install
cp .env.example .env.development   # define VITE_API_URL (backend)
npm run dev                        # http://localhost:5173
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | Oxlint |
| `npm test` | Tests E2E (Playwright, API simulada) |

## Arquitectura (por features)

```
src/
├─ main.jsx                  entrada: monta React + tema Ant Design
├─ app/                      composición global
│  ├─ App.jsx                providers + tabla de rutas (lazy)
│  ├─ AppLayout.jsx          header + contenedor de páginas autenticadas
│  ├─ queryClient.js         config de React Query
│  └─ theme.js               tema/idioma de Ant Design
├─ features/                 una carpeta por dominio de negocio
│  ├─ auth/                  login con CURP, sesión, ruta protegida
│  ├─ maniobras/             lista, countdown, hook useMyManiobras
│  └─ seguimiento/           stepper de ruta, eventos, guardado de estatus
└─ shared/                   código sin lógica de negocio, reutilizable
   ├─ api/client.js          instancia axios + header X-Operator-Curp
   ├─ components/            TILLogo, GlobalLoader, WaveBackground
   ├─ lib/                   toast, backendMessage, storage keys
   └─ styles/index.css       estilos globales y overrides de antd
```

Regla de dependencias: `app → features → shared`. Un feature puede importar de `shared` (y de otro feature solo cuando comparte datos, p. ej. `seguimiento` usa `maniobras`); `shared` nunca importa de `features`.

## Sesión

No hay token: el operador se identifica con su CURP (`POST /operator-auth/login` de TIL_Backend), que devuelve un JWT; se guarda en `localStorage` y se envía como `Authorization: Bearer` en cada request.

## Documentación de aprendizaje

Guía paso a paso para construir un proyecto igual desde cero: [`docs/GUIA_APRENDIZAJE.md`](docs/GUIA_APRENDIZAJE.md).
