import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode for smoother development
  reactStrictMode: false,
  
  // Image optimization settings
  images: {
    // Allow images from any domain (useful for product images)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Compiler options for production
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Turbopack configuration (Next.js 16+ default)
  // Empty config enables Turbopack with default settings
  turbopack: {},
  
  // Note: webpack config removed - Next.js 16 uses Turbopack by default
  // If webpack fallbacks are needed, they are handled automatically by Turbopack
};

export default nextConfig;
