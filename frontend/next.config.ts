import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode for smoother development
  reactStrictMode: false,
  
  // Enable static exports for better performance (optional)
  // output: 'standalone', // Uncomment for Docker deployments
  
  // Image optimization settings
  images: {
    // Allow images from any domain (useful for product images)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Disable image optimization for Vercel free tier (optional)
    // unoptimized: true,
  },
  
  // Environment variables that are available at build time
  // NEXT_PUBLIC_* variables are automatically available
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Enable trailing slashes for cleaner URLs (optional)
  // trailingSlash: true,
  
  // Compiler options for production
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Webpack configuration (if needed)
  webpack: (config, { isServer }) => {
    // Fix for some packages that don't work well with webpack
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
