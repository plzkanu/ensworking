import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const files = [
  "src/legacy/regular/app.js",
  "src/legacy/flexible/app.js",
  "public/overtime/regular/app.js",
  "public/overtime/flexible/app.js",
  "public/overtime/app.js",
];

const helperBlock =
  /\nfunction addDaysToIsoDate\(dateStr, days\) \{[\s\S]*?\n\}\n\nfunction segmentWorkDate\(baseDate, absMin\) \{[\s\S]*?\n\}\n/;

for (const relative of files) {
  const filePath = path.join(root, relative);
  let js = fs.readFileSync(filePath, "utf8");

  js = js.replace(helperBlock, "\n");

  js = js.replace(
    /\{ \.\.\.r, date: segmentWorkDate\(r\.date, startMin\), start: r\.start,/g,
    "{ ...r, start: r.start,",
  );
  js = js.replace(
    /\{ \.\.\.r, date: segmentWorkDate\(r\.date, seg2Start\), start: toHHMM\(seg2Start\), end: toHHMM\(seg2End\), hours: seg2Hours,/g,
    "{ ...r, start: toHHMM(seg2Start), end: toHHMM(seg2End), hours: seg2Hours,",
  );
  js = js.replace(
    /\{ \.\.\.r, date: segmentWorkDate\(r\.date, startMin\), start: r\.start, end: toHHMM\(seg1End\), hours: morningH,/g,
    "{ ...r, start: r.start, end: toHHMM(seg1End), hours: morningH,",
  );
  js = js.replace(
    /\{ \.\.\.r, date: segmentWorkDate\(r\.date, seg2Start\), start: toHHMM\(seg2Start\), end: r\.end, hours: afternoonH,/g,
    "{ ...r, start: toHHMM(seg2Start), end: r.end, hours: afternoonH,",
  );
  js = js.replace(
    /(\.\.\.r,\s*\n\s*)date: segmentWorkDate\(r\.date, seg\.s\),\s*\n/g,
    "$1",
  );

  fs.writeFileSync(filePath, js);
  console.log("patched", relative);
}

console.log("done");
