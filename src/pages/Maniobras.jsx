import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Table, Card, Row, Col, Tag, Progress, Alert, Empty } from 'antd'
import { EnvironmentOutlined, RightOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { maniobrasService } from '../services/maniobrasService'
import CountdownTag from '../components/CountdownTag'
import { remainingMs } from '../utils/countdown'

const { Title, Text } = Typography

// Cards on mobile, table on desktop - toggled by CSS so both render once and no
// layout hook/breakpoint listener is needed for something this simple.
const LIST_STYLES = `
  .til-op-list-table { display: none; }
  .til-op-list-cards { display: block; }
  @media (min-width: 768px) {
    .til-op-list-table { display: block; }
    .til-op-list-cards { display: none; }
  }
`

function statusColor(v) {
  if (typeof v !== 'string' || !v) return 'default'
  const s = v.toLowerCase()
  if (s.includes('inici')) return 'orange'
  if (s.includes('cancel')) return 'red'
  return 'blue'
}

export default function Maniobras() {
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mis-maniobras'],
    queryFn:  () => maniobrasService.getMine().then(r => r.data?.maneuvers_data ?? []),
  })

  // Menor tiempo restante primero...
  const sorted = useMemo(
    () => [...(data ?? [])].sort((a, b) => remainingMs(a.man_dispatch_date) - remainingMs(b.man_dispatch_date)),
    [data]
  )

  function openManiobra(record) {
    navigate(`/maniobras/${record.man_id}`)
  }

  const columns = [
    {
      title: 'Folio / Fecha',
      key: 'folio',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.man_containers?.[0]?.container_id ?? r.man_id}</div>
          <div style={{ fontSize: 12, color: '#7aafc8' }}>{r.man_dispatch_date ?? '—'}</div>
        </div>
      ),
    },
    {
      title: 'Origen',
      key: 'origen',
      render: (_, r) => <span style={{ fontSize: 12 }}>{r.man_load_location ?? '—'}</span>,
    },
    {
      title: 'Destino',
      key: 'destino',
      render: (_, r) => <span style={{ fontSize: 12 }}>{r.man_unload_location ?? '—'}</span>,
    },
    {
      title: 'Estatus actual',
      key: 'estatus',
      render: (_, r) =>
        r.man_current_status
          ? <Tag color={statusColor(r.man_current_status)}>{r.man_current_status}</Tag>
          : <Text style={{ color: '#7aafc8' }}>Sin iniciar</Text>,
    },
    {
      title: 'Inicia',
      key: 'countdown',
      render: (_, r) => <CountdownTag dispatchDate={r.man_dispatch_date} />,
    },
    {
      title: 'Progreso',
      key: 'progreso',
      width: 140,
      render: (_, r) => <Progress percent={parseInt(r.man_progress, 10) || 0} size="small" />,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <style>{LIST_STYLES}</style>
      <Title level={3} style={{ marginBottom: 16 }}>Mis maniobras</Title>

      {isError && (
        <Alert
          description="No se pudo cargar la información de maniobras. Verifica tu conexión."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <Empty description="No tienes maniobras pendientes por completar" style={{ marginTop: 40 }} />
      )}

      <div className="til-op-list-table">
        <Table
          columns={columns}
          dataSource={sorted}
          rowKey="man_id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="small"
          onRow={record => ({ onClick: () => openManiobra(record), style: { cursor: 'pointer' } })}
        />
      </div>

      <div className="til-op-list-cards">
        <Row gutter={[12, 12]}>
          {sorted.map(r => (
            <Col xs={24} key={r.man_id}>
              <Card size="small" hoverable onClick={() => openManiobra(r)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.man_containers?.[0]?.container_id ?? r.man_id}</div>
                    <div style={{ fontSize: 12, color: '#7aafc8', marginTop: 2 }}>
                      <EnvironmentOutlined /> {r.man_load_location ?? '—'} → {r.man_unload_location ?? '—'}
                    </div>
                  </div>
                  <RightOutlined style={{ color: '#7aafc8' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <CountdownTag dispatchDate={r.man_dispatch_date} />
                  {r.man_current_status && (
                    <Tag color={statusColor(r.man_current_status)} style={{ margin: 0 }}>{r.man_current_status}</Tag>
                  )}
                </div>
                <Progress percent={parseInt(r.man_progress, 10) || 0} size="small" style={{ marginTop: 8 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
