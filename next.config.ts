import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
