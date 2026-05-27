import { MetadataRoute } from 'next';

/**
 * Dynamic PWA Manifest
 * Standardized for modern mobile browsers to ensure "Add to Home Screen"
 * works perfectly on both iOS and Android.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const dbUrl = "https://oskarshop-631c5-default-rtdb.firebaseio.com";
  let logoUrl = 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O';

  try {
    const res = await fetch(`${dbUrl}/settings.json`, { next: { revalidate: 60 } });
    const settings = await res.json();
    if (settings?.logo) {
      logoUrl = settings.logo;
    }
  } catch (e) {
    console.error("Failed to fetch dynamic manifest logo:", e);
  }

  return {
    name: 'Oskar Shop - Game Top-Up',
    short_name: 'OskarShop',
    description: 'The best gaming top-up service and accounts store in Somalia.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFFFFF',
    theme_color: '#0EA5E9',
    icons: [
      {
        src: logoUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: logoUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
