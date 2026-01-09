import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // NOTE: API routes are handled by FastAPI backend via vercel.json routing
  // Do NOT add rewrites for /api/* as it will intercept requests meant for FastAPI
};

export default nextConfig;
