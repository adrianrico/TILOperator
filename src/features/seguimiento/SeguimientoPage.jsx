import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Typography, Card, Steps, Timeline, Tag, Space, Button, Alert, Spin, Row, Col } from 'antd'
import { ArrowLeftOutlined, CheckCircleFilled, StopOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maniobrasService } from '../maniobras/maniobrasService'
import { useMyManiobras, MY_MANIOBRAS_KEY } from '../maniobras/useMyManiobras'
import CountdownTag from '../maniobras/CountdownTag'
import { rutasService } from './rutasService'
import { buildPointMap, parseManStatus } from './routeEvents'
import { useIsDesktop } from './useIsDesktop'
import { toast } from '../../shared/lib/toast'

const { Title, Text } = Typography
/** Evento de cancelación que la UI agrega siempre al final de la lista de eventos de un punto. */
const CANCEL_EVENT = 'CANCELADO'

/**
 * Seguimiento de una maniobra (`/maniobras/:manId`).
 * El operador elige en el `Steps` el punto donde está, luego el evento (y subevento) y guarda;
 * el backend actualiza ubicación y estatus de la maniobra.
 *
 * Estado local `selection`: `{ location, status, subevent }`; se rehidrata desde el servidor
 * cada vez que cambian la ubicación/estatus guardados de la maniobra.
 */
export default function SeguimientoPage() {
  const { manId } = useParams()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const queryClient = useQueryClient()

  const { data: maniobras = [], isLoading: loadingManiobras } = useMyManiobras()

  const { data: rutas = [], isLoading: loadingRutas } = useQuery({
    queryKey: ['rutas'],
    queryFn:  () => rutasService.readAll().then(r => r.data?.routes_data ?? []),
  })

  const record = maniobras.find(m => m.man_id === manId) ?? null

  const points = useMemo(() => (record ? buildPointMap(record, rutas) : []), [record, rutas])

  const [selection, setSelection] = useState({ location: '', status: '', subevent: '' })

  // (Re)hydrate local selection whenever this record's server state changes -
  // e.g. right after loading, or after a successful save refreshes the query...
  useEffect(() => {
    if (!record) return
    const parsed = parseManStatus(record.man_current_status)
    setSelection({ location: record.man_current_location ?? '', status: parsed.event, subevent: parsed.subevent })
  }, [record?.man_id, record?.man_current_location, record?.man_current_status])

  const locationMutation = useMutation({
    mutationFn: (d) => maniobrasService.updateLocation(d),
    onSuccess: () => {
      toast.success('Ubicación actualizada')
      queryClient.invalidateQueries({ queryKey: MY_MANIOBRAS_KEY })
    },
    onError: (err) => toast.error('Error al actualizar la ubicación', err),
  })

  if (loadingManiobras || loadingRutas) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!record) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
          Volver
        </Button>
        <Alert
          type="warning"
          showIcon
          message="Maniobra no encontrada"
          description="Puede que ya no esté asignada a ti o que ya haya sido completada."
        />
      </div>
    )
  }

  const matchedIndex      = points.findIndex(p => p.value === selection.location)
  const matchedPoint      = matchedIndex >= 0 ? points[matchedIndex] : null
  const isValidLocation   = !!selection.location && !!matchedPoint
  const events            = isValidLocation ? [...matchedPoint.events, { event_name: CANCEL_EVENT, sub_events: [] }] : []
  const currentEventIndex = events.findIndex(e => e.event_name === selection.status)

  const sentStatus  = selection.status && selection.subevent ? `${selection.status} / ${selection.subevent}` : (selection.status ?? '')
  const unchanged    = selection.location === (record.man_current_location ?? '') && sentStatus === (record.man_current_status ?? '')
  const noLocation    = !isValidLocation || matchedPoint.events.length === 0
  const saveDisabled  = noLocation || unchanged || !selection.status

  function selectLocation(point) {
    setSelection({ location: point.value, status: '', subevent: '' })
  }
  function selectEvent(eventName) {
    setSelection(s => ({ ...s, status: eventName, subevent: '' }))
  }
  function selectSubEvent(sub) {
    setSelection(s => ({ ...s, subevent: sub }))
  }

  function handleSave() {
    locationMutation.mutate({
      man_id:               record.man_id,
      man_current_location: selection.location,
      man_current_status:   sentStatus,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>Volver</Button>
        <CountdownTag dispatchDate={record.man_dispatch_date} />
      </div>

      <Card>
        <Title level={4} style={{ marginBottom: 4 }}>
          {record.man_containers?.[0]?.container_id ?? record.man_id}
        </Title>
        {record.man_update_date && (
          <div style={{ fontSize: 12, color: '#7aafc8' }}>
            Última actualización: {record.man_update_date}
          </div>
        )}
      </Card>

      <Card title="Seguimiento">
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12}>
            <Text style={{ color: '#7aafc8', fontSize: 12, display: 'block' }}>Origen</Text>
            <Text style={{ fontSize: 14 }}>{record.man_load_location ?? '—'}</Text>
          </Col>
          <Col xs={12}>
            <Text style={{ color: '#7aafc8', fontSize: 12, display: 'block' }}>Destino</Text>
            <Text style={{ fontSize: 14 }}>{record.man_unload_location ?? '—'}</Text>
          </Col>
        </Row>

        {points.length === 0 ? (
          <Text style={{ color: '#aaa' }}>Sin ruta asignada a esta maniobra</Text>
        ) : (
          <>
            <Steps
              size="small"
              direction={isDesktop ? 'horizontal' : 'vertical'}
              current={matchedIndex >= 0 ? matchedIndex : -1}
              onChange={i => selectLocation(points[i])}
              style={{ cursor: 'pointer' }}
              items={points.map((p, pIdx) => {
                // Events render as THIS step's own description, so they land right
                // below the point they belong to instead of a single shared block
                // that always sat under the first step.
                if (pIdx !== matchedIndex) return { title: p.label }
                if (!isValidLocation) return { title: p.label }
                if (p.events.length === 0) {
                  return { title: p.label, description: <Text style={{ color: '#aaa', fontSize: 12 }}>Sin eventos definidos para este punto</Text> }
                }
                return {
                  title: p.label,
                  description: (
                    <Timeline
                      style={{ marginTop: 8, textAlign: 'left' }}
                      items={events.map((e, idx) => {
                        const isCancel        = e.event_name === CANCEL_EVENT
                        const isSelected      = e.event_name === selection.status
                        const isCompleted     = !isCancel && currentEventIndex >= 0 && idx < currentEventIndex
                        const isDone          = isSelected || isCompleted
                        const currentSubIndex = e.sub_events.indexOf(selection.subevent)
                        return {
                          key: e.event_name,
                          color: isDone ? (isCancel ? 'red' : 'blue') : 'gray',
                          dot: isDone
                            ? <CheckCircleFilled style={{ color: isCancel ? '#ff4d4f' : '#1677ff' }} />
                            : (isCancel ? <StopOutlined style={{ color: '#ff4d4f' }} /> : undefined),
                          children: (
                            <div>
                              <div
                                style={{
                                  cursor:     'pointer',
                                  fontWeight: isSelected ? 600 : (isCompleted ? 500 : 400),
                                  fontSize:   13,
                                  color:      isCancel ? '#ff4d4f' : undefined,
                                }}
                                onClick={() => selectEvent(e.event_name)}
                              >
                                {isCancel ? 'Cancelar' : e.event_name}
                              </div>
                              {isSelected && e.sub_events.length > 0 && (
                                <div style={{ paddingLeft: 10, marginTop: 4, borderLeft: '2px dashed #0695E4' }}>
                                  <Space size={[4, 4]} wrap>
                                    {e.sub_events.map((se, subIdx) => {
                                      const isSubSelected  = se === selection.subevent
                                      const isSubCompleted = currentSubIndex >= 0 && subIdx < currentSubIndex
                                      const isSubDone      = isSubSelected || isSubCompleted
                                      return (
                                        <Tag.CheckableTag key={se} checked={isSubDone} onChange={() => selectSubEvent(se)}>
                                          {isSubDone && <CheckCircleFilled style={{ marginRight: 4 }} />}
                                          {se}
                                        </Tag.CheckableTag>
                                      )
                                    })}
                                  </Space>
                                </div>
                              )}
                            </div>
                          ),
                        }
                      })}
                    />
                  ),
                }
              })}
            />

            {!isValidLocation && (
              <Text style={{ color: '#aaa', display: 'block', marginTop: 8 }}>Selecciona una ubicación para ver sus pasos</Text>
            )}

            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={locationMutation.isPending}
              disabled={saveDisabled}
              onClick={handleSave}
              block
              size="large"
              style={{ marginTop: 16 }}
            >
              Guardar actualización
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
