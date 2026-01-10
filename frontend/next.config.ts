import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // NOTE: Frontend and backend are now deployed separately
  // All API calls use NEXT_PUBLIC_API_URL environment variable
  // No rewrites or proxy configurations needed
};

export default nextConfig;
