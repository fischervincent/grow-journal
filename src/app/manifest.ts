import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Grow Journal - Plant Care',
    short_name: 'GrowJournal',
    description: 'Log plant care, track growth over time, and get reminders for watering and fertilizing.',
    start_url: '/plants',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#166534',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}