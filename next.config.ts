import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // UploadThing-hosted user content (squad logos, banners, products, news).
    remotePatterns: [
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
  experimental: {
    authInterrupts: true,
    // shadcn components import from the phosphor barrel; without this the
    // whole icon library can land in client bundles.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  reactCompiler: true,
  allowedDevOrigins: ["192.168.0.104"],
};

export default nextConfig;
