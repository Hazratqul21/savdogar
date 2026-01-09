import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // NOTE: API routes are handled by FastAPI backend via vercel.json routing
  // Do NOT add rewrites for /api/* as it will intercept requests meant for FastAPI
  
  // CRITICAL: Disable Next.js API routes to prevent 405 errors
  // All /api/* requests should be handled by Python backend via vercel.json routing
  async rewrites() {
    return [];
  },
  
  // Ensure /api/* paths are not handled by Next.js
  async headers() {
    return [];
  },
};

export default nextConfig;
