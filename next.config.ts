import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A package-lock.json in the user's home folder would otherwise be taken as the workspace root.
  outputFileTracingRoot: import.meta.dirname,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
