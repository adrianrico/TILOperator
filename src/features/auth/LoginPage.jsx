import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, Button, Typography, Form } from 'antd'
import { IdcardOutlined, LoginOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import TILLogo from '../../shared/components/TILLogo'
import { toast } from '../../shared/lib/toast'

const { Text } = Typography

/** Pantalla de inicio de sesión: el operador entra con su CURP. */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [curp, setCurp] = useState('')

  const loginMutation = useMutation({
    mutationFn: () => login(curp.trim()),
    onSuccess: (operator) => {
      toast.success(`Bienvenido, ${operator.operator_name}`)
      navigate('/', { replace: true })
    },
    onError: (err) => toast.error('No se pudo iniciar sesión', err),
  })

  function onSubmit() {
    if (!curp.trim()) return
    loginMutation.mutate()
  }

  return (
    <div
      style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        16,
        position:       'relative',
        zIndex:         1,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <TILLogo height={40} />
          <Text style={{ color: '#7aafc8', fontSize: 13, textAlign: 'center' }}>
            Ingresa con tu CURP para ver tus maniobras asignadas
          </Text>
        </div>

        <Form layout="vertical" onFinish={onSubmit}>
          <Form.Item label="CURP" required style={{ marginBottom: 20 }}>
            <Input
              prefix={<IdcardOutlined />}
              placeholder="Ej. GORA900101HDFXXX01"
              size="large"
              maxLength={18}
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase())}
              autoFocus
              allowClear
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<LoginOutlined />}
            size="large"
            block
            loading={loginMutation.isPending}
            disabled={!curp.trim()}
          >
            Ingresar
          </Button>
        </Form>
      </Card>
    </div>
  )
}
