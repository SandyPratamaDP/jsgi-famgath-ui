import type { NextConfig } from 'next';
import { BASE_PATH } from './lib/basePath';

// Backend Laravel hanya diakses dari server Next.js sendiri (internal),
// tidak pernah langsung dari browser. Ganti via env kalau Laravel pindah host.
const LARAVEL_INTERNAL_URL = process.env.LARAVEL_INTERNAL_URL || 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  allowedDevOrigins: ['10.192.132.249'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${LARAVEL_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
