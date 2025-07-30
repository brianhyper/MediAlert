import { type MetadataRoute } from 'next';

const manifest = (): MetadataRoute.Manifest => ({
  short_name: 'MediAlert',
  name: 'MediAlert',
  description: 'A smart pill dispenser monitor.',
  start_url: '/',
  background_color: '#F0F4F7',
  display: 'standalone',
  scope: '/',
 theme_color: '#00A3FF',
  icons: [
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    },
  ],
});

export default manifest;
