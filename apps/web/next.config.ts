import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBackend = process.env.NEXT_PUBLIC_API_BACKEND_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBackend}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
