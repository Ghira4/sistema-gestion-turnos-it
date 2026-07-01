import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Turnos IT - Gestion',
    short_name: 'Turnos IT',
    description: 'Sistema de gestion interna de Turnos Consulares IT',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0f1b35',
    theme_color: '#0f1b35',
    orientation: 'portrait-primary',
    icons: [
      { src: '/logo.png', sizes: '192x192', type: 'image/png' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
