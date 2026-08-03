/**
 * Replit 등 CI 환경에서 webpack 빌드 시 메모리·캐시 문제를 줄입니다.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const extraNodeOptions = "--max-old-space-size=4096";
const nodeOptions = process.env.NODE_OPTIONS
  ? `${process.env.NODE_OPTIONS} ${extraNodeOptions}`
  : extraNodeOptions;

const result = spawnSync(
  process.execPath,
  [nextBin, "build", "--webpack"],
  {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
  },
);

process.exit(result.status ?? 1);
