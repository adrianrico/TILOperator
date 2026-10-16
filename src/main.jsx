import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './shared/styles/index.css'
import App from './app/App.jsx'
import { antdLocale, antdTheme } from './app/theme'

// Punto de entrada: monta React y envuelve la app con el tema/idioma de Ant Design.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={antdLocale} theme={antdTheme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
