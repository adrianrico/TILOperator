import { Outlet, useNavigate } from 'react-router-dom'
import { Layout, Button, Typography } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import TILLogo from '../TILLogo'
import { useAuth } from '../../context/AuthContext'

const { Header, Content } = Layout
const { Text } = Typography

const GLASS = {
  nav:           'rgba(0, 10, 28, 0.72)',
  navBorder:     '1px solid rgba(6, 149, 228, 0.2)',
  navShadow:     '0 4px 24px rgba(0, 0, 0, 0.3)',
  content:       'rgba(0, 14, 38, 0.45)',
  contentBorder: '1px solid rgba(6, 149, 228, 0.18)',
  contentShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  blur:          'blur(8px)',
}

const NAV_STYLES = `
  .til-op-header { border-bottom: ${GLASS.navBorder}; }

  @media (min-width: 1100px) {
    .til-op-header { border-bottom: none; }
  }

  .til-op-content { padding: 24px; }

  @media (min-width: 1100px) {
    .til-op-content { padding: 12px 20px; }
  }

  @media (max-width: 575px) {
    .til-op-content {
      padding:    10px;
      margin:     8px !important;
      min-height: calc(100vh - 80px) !important;
    }
    .til-op-operator-name { display: none; }
  }
`

export default function AppLayout() {
  const navigate = useNavigate()
  const { operator, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <style>{NAV_STYLES}</style>

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
    </>
  )
}
