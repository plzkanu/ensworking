import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function extract(file, outDir) {
  const c = fs.readFileSync(file, "utf8");
  const styleMatch = c.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch = c.match(/<body>([\s\S]*?)<script>/);
  const scriptMatch = c.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  if (!styleMatch || !bodyMatch || !scriptMatch) {
    throw new Error(`parse fail ${file}`);
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "styles.css"), styleMatch[1]);
  let body = bodyMatch[1];
  const conIdx = body.indexOf('<div class="con">');
  if (conIdx >= 0) {
    body = body.slice(conIdx);
  }
  fs.writeFileSync(path.join(outDir, "body.html"), body.trim());
  fs.writeFileSync(path.join(outDir, "app.js"), scriptMatch[1]);
  console.log(
    path.basename(file),
    "css",
    styleMatch[1].length,
    "body",
    body.length,
    "js",
    scriptMatch[1].length,
  );
}

extract(
  path.join(root, "시간외근무_일반근무.html"),
  path.join(root, "src/legacy/regular"),
);
extract(
  path.join(root, "시간외근무_유연근무.html"),
  path.join(root, "src/legacy/flexible"),
);
