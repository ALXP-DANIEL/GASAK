import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  images: {
    // UploadThing-hosted user content (squad logos, banners, products, news)
    // plus picsum for seeded placeholder gallery/merch images.
    remotePatterns: [
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Payment pages must never render inside a third-party frame.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  experimental: {
    authInterrupts: true,
    serverActions: {
      // Image uploads (auth images, galleries, products) send the file in
      // the action body; the default 1 MB limit 500s before saveUpload's
      // own 4 MB check can run. Extra 1 MB covers multipart overhead.
      bodySizeLimit: "5mb",
    },
    // shadcn components import from the phosphor barrel; without this the
    // whole icon library can land in client bundles.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  reactCompiler: true,
  allowedDevOrigins: ["192.168.0.104"],
};

export default nextConfig;
