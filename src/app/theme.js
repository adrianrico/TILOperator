import { theme } from 'antd'
import esES from 'antd/locale/es_ES'

/** Idioma de los componentes de Ant Design (textos de paginación, vacíos, etc.). */
export const antdLocale = esES

/** Tema oscuro azul de TIL. Los tokens se complementan con los estilos de index.css. */
export const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary:           '#0695E4',
    colorBgBase:            '#010d1a',
    colorBgLayout:          'transparent',
    colorBgContainer:       'rgba(0, 18, 48, 0.35)',
    colorBgElevated:        'rgba(0, 15, 40, 0.88)',
    colorBgSpotlight:       'rgba(0, 15, 40, 0.92)',
    colorBorder:            'rgba(6, 149, 228, 0.25)',
    colorBorderSecondary:   'rgba(6, 149, 228, 0.14)',
    colorText:              '#c9d8e8',
    colorTextHeading:       '#e8f4ff',
    colorTextSecondary:     '#7aafc8',
    borderRadius:           8,
  },
}
