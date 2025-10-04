import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  matcher: ['/activities/:path*', '/plan/:path*', '/settings/:path*'],
};

export default nextConfig;
