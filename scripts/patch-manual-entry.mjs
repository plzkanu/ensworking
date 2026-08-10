import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const modals = fs.readFileSync(
  path.join(root, "public/overtime/manual-entry-modals.html"),
  "utf8",
);

const css = `
.manual-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:520px){.manual-grid{grid-template-columns:1fr}}
.dup-pick-btn{display:block;width:100%;text-align:left;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);cursor:pointer;font-family:inherit;font-size:13px;margin-bottom:8px;transition:.15s}
.dup-pick-btn:hover{border-color:var(--blue);background:var(--blue-bg)}
`;

const manualRow = `
    <div class="uprow" style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--line)">
      <span class="upsec-title">✏️ 수동 입력</span>
      <button type="button" class="mbtn" onclick="openManualEntryModal()">근무기록 1건 추가</button>
      <span style="font-size:11px;color:var(--t3)">HWP 없이 한 건씩 직접 입력</span>
    </div>`;

const targets = [
  {
    file: "public/overtime/regular/index.html",
    skipFriday: false,
    isIndex: true,
  },
  {
    file: "public/overtime/flexible/index.html",
    skipFriday: true,
    isIndex: true,
  },
  {
    file: "src/legacy/regular/body.html",
    skipFriday: false,
    isIndex: false,
  },
  {
    file: "src/legacy/flexible/body.html",
    skipFriday: true,
    isIndex: false,
  },
];

for (const target of targets) {
  const filePath = path.join(root, target.file);
  let html = fs.readFileSync(filePath, "utf8");

  if (!html.includes('id="manualEntryModal"')) {
    html = html.replace(
      /  <div class="upsec">/,
      modals + "\n\n  <div class=\"upsec\">",
    );
    html = html.replace(
      /    <div class="flist" id="flist"><\/div>/,
      manualRow + '\n    <div class="flist" id="flist"></div>',
    );
    html = html.replace(
      `<button class="btn bs" onclick="clearRecords()">🗑 목록 삭제</button>`,
      `<button class="btn" style="background:#3182F6;color:#fff" onclick="openManualEntryModal()">✏️ 수동 입력</button>\n        <button class="btn bs" onclick="clearRecords()">🗑 목록 삭제</button>`,
    );
  }

  if (target.isIndex) {
    if (!html.includes(".manual-grid")) {
      html = html.replace("</style>", css + "</style>");
    }
    const scriptBlock =
      `<script>window.MANUAL_ENTRY_SKIP_FRIDAY_0918=${target.skipFriday};</script>\n<script src="../manual-entry.js"></script>\n`;
    if (!html.includes("manual-entry.js")) {
      html = html.replace(
        '<script src="app.js"></script>',
        `<script src="app.js"></script>\n${scriptBlock}`,
      );
    }
  }

  fs.writeFileSync(filePath, html);
  console.log("updated", target.file);
}

console.log("done");
