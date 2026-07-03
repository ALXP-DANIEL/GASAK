import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  reactCompiler: true,
  allowedDevOrigins: ["192.168.0.104"],
};

export default nextConfig;
