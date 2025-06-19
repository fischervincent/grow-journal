import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
    // Optimize bundling
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
  },

  // Compression for better performance and lower bandwidth costs
  compress: true,

  // Add cache headers for optimized images
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimized for plant images
    minimumCacheTTL: 31536000, // 1 year cache
    formats: ['image/webp'], // Only WebP - no double compression with AVIF
    deviceSizes: [640, 768, 1024, 1280, 1920], // Streamlined for your breakpoints
    imageSizes: [64, 128, 256, 384, 512, 800], // Optimized for plant card/detail sizes
  },
};

export default nextConfig;
