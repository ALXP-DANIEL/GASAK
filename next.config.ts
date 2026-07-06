import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  reactCompiler: true,
  allowedDevOrigins: ["192.168.0.104"],
};

export default nextConfig;
