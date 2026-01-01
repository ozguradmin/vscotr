/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fsvihpyfvvxvtycfozvb.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    // Görsel boyutları - mobil ve desktop için
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp'],
  },
}

export default nextConfig