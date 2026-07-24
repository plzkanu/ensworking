/**
 * Replit이 자동 생성하는 artifacts/ 폴더를 빌드 전에 제거합니다.
 * Next.js 앱과 충돌해 배포 시 500 오류가 날 수 있습니다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = path.join(root, "artifacts");

if (fs.existsSync(artifacts)) {
  fs.rmSync(artifacts, { recursive: true, force: true });
  console.log("[prebuild] removed artifacts/");
}
