import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // xlsx-js-style는 용량이 커서 webpack 번들 시 Replit 등에서 OOM이 날 수 있음
  serverExternalPackages: ["xlsx-js-style", "bcryptjs"],
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon.png",
        permanent: false,
      },
    ];
  },
  webpack: (config, { dev }) => {
    // Replit webpack WasmHash / FileSystemInfo 오류 완화
    if (!dev) {
      config.cache = false;
      if (config.output) {
        config.output.hashFunction = "sha256";
      }
    }
    return config;
  },
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
