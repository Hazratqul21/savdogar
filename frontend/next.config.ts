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
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
