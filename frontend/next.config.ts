import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  poweredByHeader: false,
  
  typescript: {
    // Ignore TypeScript errors during build to speed up deployment
    // We still get type checking in development via IDE
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
