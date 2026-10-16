import { notification } from 'antd'
import { backendMessage } from './backendMessage'

notification.config({ placement: 'top', duration: 4, maxCount: 3 })

/**
 * Notificaciones tipo "toast" con el estilo `maylob-toast` (ver index.css).
 */
export const toast = {
  /** @param {string} message */
  success(message) {
    notification.success({ message, className: 'maylob-toast', placement: 'top' })
  },
  /**
   * @param {string} message - Título del error.
   * @param {unknown} [err] - Error de axios; si trae mensaje del backend se muestra como detalle.
   */
  error(message, err) {
    notification.error({
      message,
      description: err ? backendMessage(err, undefined) : undefined,
      className: 'maylob-toast',
      placement: 'top',
    })
  },
}
