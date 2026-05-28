import { MetadataRoute } from 'next';

/**
 * PWA Manifest Configuration
 * Standardized for modern mobile browsers to ensure "Add to Home Screen"
 * works perfectly on both iOS and Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OskarShop',
    short_name: 'OskarShop',
    description: 'The best gaming top-up and accounts store in Somalia.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
