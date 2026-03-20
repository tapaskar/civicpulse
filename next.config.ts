import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization — allow Supabase storage domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Compress responses
  compress: true,

  // Cache static assets aggressively
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
    {
      // Static assets — 1 year cache
      source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // JS/CSS chunks — immutable (hashed filenames)
      source: '/_next/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],

  // Experimental performance features
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
