import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // xlsx-js-style는 용량이 커서 webpack 번들 시 Replit 등에서 OOM이 날 수 있음
  serverExternalPackages: ["xlsx-js-style"],
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
