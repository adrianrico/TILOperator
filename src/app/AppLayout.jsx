import { Outlet, useNavigate } from 'react-router-dom'
import { Layout, Button, Typography } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import TILLogo from '../shared/components/TILLogo'
import { useAuth } from '../features/auth/AuthContext'

const { Header, Content } = Layout
const { Text } = Typography

/** Valores del efecto "glassmorphism" (vidrio translúcido) del header y del contenido. */
const GLASS = {
  nav:           'rgba(0, 10, 28, 0.72)',
  navShadow:     '0 4px 24px rgba(0, 0, 0, 0.3)',
  content:       'rgba(0, 14, 38, 0.45)',
  contentBorder: '1px solid rgba(6, 149, 228, 0.18)',
  contentShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  blur:          'blur(8px)',
}

/**
 * Estructura de las páginas autenticadas: header fijo (logo, nombre del operador, salir)
 * y área de contenido donde se renderiza la ruta hija (`<Outlet />`).
 * Los breakpoints responsivos viven en index.css (`.til-op-*`).
 */
export default function AppLayout() {
  const navigate = useNavigate()
  const { operator, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent', position: 'relative', zIndex: 1 }}>
      <Header
        className="til-op-header"
        style={{
          position:             'sticky',
          top:                  0,
          zIndex:               100,
          display:              'flex',
          alignItems:           'center',
          gap:                  16,
          height:               64,
          padding:              '0 24px',
          background:           GLASS.nav,
          backdropFilter:       GLASS.blur,
          WebkitBackdropFilter: GLASS.blur,
          boxShadow:            GLASS.navShadow,
        }}
      >
        <TILLogo height={32} />

        <div style={{ flex: 1 }} />

        {operator && (
          <Text className="til-op-operator-name" style={{ color: '#7aafc8', fontSize: 13 }}>
            {operator.operator_name}
          </Text>
        )}

        <Button
          type="text"
          icon={<LogoutOutlined style={{ fontSize: 18 }} />}
          onClick={handleLogout}
          style={{ color: '#7aafc8' }}
        >
          Salir
        </Button>
      </Header>

      <Content
        className="til-op-content"
        style={{
          margin:               '24px',
          display:              'flex',
          flexDirection:        'column',
          background:           GLASS.content,
          backdropFilter:       GLASS.blur,
          WebkitBackdropFilter: GLASS.blur,
          borderRadius:         12,
          border:               GLASS.contentBorder,
          boxShadow:            GLASS.contentShadow,
          minHeight:            'calc(100vh - 112px)',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  )
}
