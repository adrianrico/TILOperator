import { Tag } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { countdownLabel } from './countdown'

/**
 * Etiqueta con el tiempo restante para el despacho (ej. "Inicia mañana"), coloreada por urgencia.
 * @param {{ dispatchDate?: string }} props - Fecha `YYYY-MM-DD`.
 */
export default function CountdownTag({ dispatchDate }) {
  const { text, tone } = countdownLabel(dispatchDate)
  return (
    <Tag color={tone} icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
      {text}
    </Tag>
  )
}
