import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow importing shared/workspace-icons from repo root
  outputFileTracingRoot: path.join(__dirname, ".."),
  transpilePackages: [],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
