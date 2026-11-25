import path from "path";
import type { NextConfig } from "next";

/** Keep in sync with PRODUCTION_HOST in lib/marketing/site.ts (config cannot import it). */
const PRODUCTION_HOST = "www.getkangur.com";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow importing shared/workspace-icons from repo root
  outputFileTracingRoot: path.join(__dirname, ".."),
  transpilePackages: [],
  experimental: {
    externalDir: true,
    // The root layout sits under [locale], so a 404 needs its own document.
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        // Names carry a hash of the content, so a new file is a new address.
        source: "/:dir(img|og|fonts)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Staging, previews and localhost are copies of the site. Decided by host, so it
        // holds whatever environment variables a deployment has.
        source: "/:path*",
        missing: [{ type: "host", value: PRODUCTION_HOST }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
