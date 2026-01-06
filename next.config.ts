import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone output for Docker
  output: 'standalone',

  // Serve files from /uploads as static
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
