import { Tag } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { countdownLabel } from '../utils/countdown'

export default function CountdownTag({ dispatchDate }) {
  const { text, tone } = countdownLabel(dispatchDate)
  return (
    <Tag color={tone} icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
      {text}
    </Tag>
  )
}
