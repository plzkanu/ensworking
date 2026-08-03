import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function externalize(relativeDir) {
  const dir = path.join(root, relativeDir);
  const indexPath = path.join(dir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(
    /<script>\s*[\s\S]*?<\/script>\s*$/m,
    '<script src="app.js"></script>\n',
  );
  html = html.replaceAll("ERP 양식 다운로드", "ERP 양식 저장");
  html = html.replaceAll(
    "ERP 양식 다운로드를 합니다",
    "ERP 양식 데이터를 시스템에 저장합니다",
  );
  html = html.replaceAll("⬇ ERP 양식 저장", "💾 ERP 양식 저장");
  html = html.replace(
    '<button class="btn" style="background:#00C471;color:#fff" onclick="downloadExcel()">',
    '<button class="btn" style="display:none;background:#00C471;color:#fff" onclick="downloadExcel()">',
  );
  fs.writeFileSync(indexPath, html);
  console.log("updated", indexPath);
}

externalize("public/overtime/regular");
externalize("public/overtime/flexible");
