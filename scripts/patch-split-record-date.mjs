import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const helpers = `
function addDaysToIsoDate(dateStr, days) {
  if (!dateStr || !days) return dateStr;
  const dt = new Date(dateStr + 'T00:00:00');
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function segmentWorkDate(baseDate, absMin) {
  if (!baseDate) return baseDate;
  return addDaysToIsoDate(baseDate, Math.floor(absMin / 1440));
}
`;

const files = [
  "src/legacy/regular/app.js",
  "src/legacy/flexible/app.js",
  "public/overtime/regular/app.js",
  "public/overtime/flexible/app.js",
  "public/overtime/app.js",
];

for (const relative of files) {
  const filePath = path.join(root, relative);
  let js = fs.readFileSync(filePath, "utf8");

  if (!js.includes("function segmentWorkDate")) {
    js = js.replace(
      "function splitRecord(r) {",
      helpers + "\nfunction splitRecord(r) {",
    );
  }

  js = js.replace(
    /return \{\s*\n\s*\.\.\.r,\s*\n\s*\/\/ 바깥 경계\(첫 조각 시작 \/ 마지막 조각 종료\)는 원래 시각 문자열을 그대로 유지\.\s*\n\s*\/\/ toHHMM은 24:00을 00:00으로 바꿔 야간\(22:00~24:00\) 계산이 틀어지므로 방지\.\s*\n\s*start: idx === 0\s*\? r\.start : toHHMM\(seg\.s\),/g,
    `return {
      ...r,
      date: segmentWorkDate(r.date, seg.s),
      // 바깥 경계(첫 조각 시작 / 마지막 조각 종료)는 원래 시각 문자열을 그대로 유지.
      // toHHMM은 24:00을 00:00으로 바꿔 야간(22:00~24:00) 계산이 틀어지므로 방지.
      start: idx === 0       ? r.start : toHHMM(seg.s),`,
  );

  js = js.replace(
    /\{ \.\.\.r, start: r\.start,         end: toHHMM\(seg1End\),   hours: seg1Hours,/g,
    "{ ...r, date: segmentWorkDate(r.date, startMin), start: r.start,         end: toHHMM(seg1End),   hours: seg1Hours,",
  );

  js = js.replace(
    /\{ \.\.\.r, start: toHHMM\(seg2Start\), end: toHHMM\(seg2End\), hours: seg2Hours,/g,
    "{ ...r, date: segmentWorkDate(r.date, seg2Start), start: toHHMM(seg2Start), end: toHHMM(seg2End), hours: seg2Hours,",
  );

  js = js.replace(
    /\{ \.\.\.r, start: r\.start, end: toHHMM\(seg1End\), hours: morningH,/g,
    "{ ...r, date: segmentWorkDate(r.date, startMin), start: r.start, end: toHHMM(seg1End), hours: morningH,",
  );

  js = js.replace(
    /\{ \.\.\.r, start: toHHMM\(seg2Start\), end: r\.end, hours: afternoonH,/g,
    "{ ...r, date: segmentWorkDate(r.date, seg2Start), start: toHHMM(seg2Start), end: r.end, hours: afternoonH,",
  );

  fs.writeFileSync(filePath, js);
  console.log("patched", relative);
}

console.log("done");
