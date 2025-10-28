/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking happens in CI/CD pipeline
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint runs in CI/CD pipeline
    ignoreDuringBuilds: false,
  },
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: [
      'localhost',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'bizpilot-token',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;



