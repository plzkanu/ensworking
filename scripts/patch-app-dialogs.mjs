import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const files = [
  "src/legacy/regular/app.js",
  "src/legacy/flexible/app.js",
  "public/overtime/regular/app.js",
  "public/overtime/flexible/app.js",
];

function patch(content) {
  let s = content;

  s = s.replace(
    /if \(!confirm\('업로드된 파일 목록을 모두 삭제하시겠습니까\?'\)\) return;\n  hwpFiles = \[\];\n  renderFL\(\); updateParseButtons\(\);/,
    `appConfirm({ title: '파일 목록 삭제', message: '업로드된 파일 목록을 모두 삭제하시겠습니까?', confirmLabel: '삭제', danger: true }).then(function(ok) {
    if (!ok) return;
    hwpFiles = [];
    renderFL(); updateParseButtons();
  });`,
  );

  s = s.replace(
    /function clearRecords\(\)\{if\(!confirm\('파싱된 목록을 모두 삭제하시겠습니까\?'\)\)return;RECORDS=\[\];render\(\);\}/,
    `function clearRecords() {
  appConfirm({ title: '입력 목록 삭제', message: '파싱된 목록을 모두 삭제하시겠습니까?', confirmLabel: '삭제', danger: true }).then(function(ok) {
    if (!ok) return;
    RECORDS = [];
    render();
  });
}`,
  );

  s = s.replace(
    /function deleteRec\(i\) \{\n  const r = RECORDS\[i\];\n  if \(!confirm\(`\$\{r\.name\} \(\$\{r\.date\}\) 행을 삭제하시겠습니까\?\\n\\n수정본 다운로드 시 해당 행이 빈 칸으로 처리됩니다\.`\)\) return;\n  deletedRecords\.push\(\{ origName: r\.name, origEmp: r\.empno, date: r\.date, file: r\.file \}\);\n  RECORDS\.splice\(i, 1\);\n  render\(\);\n\}/,
    `function deleteRec(i) {
  const r = RECORDS[i];
  appConfirm({
    title: '행 삭제',
    message: \`\${r.name} (\${r.date}) 행을 삭제하시겠습니까?\\n\\n수정본 다운로드 시 해당 행이 빈 칸으로 처리됩니다.\`,
    confirmLabel: '삭제',
    danger: true,
  }).then(function(ok) {
    if (!ok) return;
    deletedRecords.push({ origName: r.name, origEmp: r.empno, date: r.date, file: r.file });
    RECORDS.splice(i, 1);
    render();
  });
}`,
  );

  s = s.replace(
    /alert\('저장할 데이터가 없습니다\.'\);/g,
    `void appAlert({ type: 'warning', title: '저장 불가', message: '저장할 데이터가 없습니다.' });`,
  );

  s = s.replace(
    /await saveErpSubmissionToDb\(payload\);\n    resetAfterErpSubmit\(\);\n    alert\('ERP 제출이 완료되었습니다\.'\);/,
    `await saveErpSubmissionToDb(payload);
    resetAfterErpSubmit();
    await appAlert({ type: 'success', title: 'ERP 제출 완료', message: 'ERP 제출이 완료되었습니다.\\n\\n입력 목록이 초기화되었습니다.' });`,
  );

  s = s.replace(
    /alert\('ERP 양식 저장 실패: ' \+ e\.message\);/g,
    `await appAlert({ type: 'error', title: 'ERP 저장 실패', message: String(e.message || e) });`,
  );

  s = s.replace(
    /if \(!RECORDS\.length\) \{ alert\('파싱된 데이터가 없습니다\.'\); return; \}/g,
    `if (!RECORDS.length) { void appAlert({ type: 'warning', title: '데이터 없음', message: '파싱된 데이터가 없습니다.' }); return; }`,
  );

  s = s.replace(
    /if \(!w\) alert\('팝업이 차단되었습니다\. 팝업 허용 후 다시 시도해주세요\.'\);/g,
    `if (!w) void appAlert({ type: 'warning', title: '팝업 차단', message: '팝업이 차단되었습니다.\\n팝업 허용 후 다시 시도해 주세요.' });`,
  );

  s = s.replace(
    /alert\(`⚠️ HWP 파일만 업로드 가능합니다\.\\n건너뜀: \$\{skipped\.join\(', '\)\}`\);/g,
    `void appAlert({ type: 'warning', title: '파일 형식 안내', message: \`HWP 파일만 업로드 가능합니다.\\n\\n건너뜀: \${skipped.join(', ')}\` });`,
  );

  s = s.replace(
    /if \(!ERR_ROWS\.length\) \{ alert\('내려받을 오류내역이 없습니다\.'\); return; \}/g,
    `if (!ERR_ROWS.length) { void appAlert({ type: 'info', message: '내려받을 오류내역이 없습니다.' }); return; }`,
  );

  s = s.replace(
    /alert\(`아직 검토하지 않은 항목이 \$\{untouched\.length\}개 있습니다\.\\n모든 항목을 펼쳐 올바른 이름\/사번을 확인·클릭한 뒤 다운로드해주세요\.`\);/g,
    `void appAlert({ type: 'warning', title: '검토 필요', message: \`아직 검토하지 않은 항목이 \${untouched.length}개 있습니다.\\n모든 항목을 펼쳐 올바른 이름/사번을 확인·클릭한 뒤 다운로드해 주세요.\` });`,
  );

  s = s.replace(
    /alert\('변경할 내용이 없습니다\.\\n이름\/사번 수정, V 체크 변경, 행 삭제 중 하나를 먼저 진행해주세요\.'\);/g,
    `void appAlert({ type: 'info', title: '변경 없음', message: '변경할 내용이 없습니다.\\n이름/사번 수정, V 체크 변경, 행 삭제 중 하나를 먼저 진행해 주세요.' });`,
  );

  s = s.replace(
    /alert\('자동 수정 불가: 글자수가 다른 항목뿐입니다\.\\n\(' \+ skipped\.join\(', '\) \+ '\)\\n글자수가 다른 교체는 한글에서 직접 수정해주세요\.'\);/g,
    `void appAlert({ type: 'warning', title: '자동 수정 불가', message: '글자수가 다른 항목뿐입니다.\\n(' + skipped.join(', ') + ')\\n글자수가 다른 교체는 한글에서 직접 수정해 주세요.' });`,
  );

  s = s.replace(
    /if \(typeof CFB === 'undefined'\) \{ alert\('수정 라이브러리\(CFB\) 로딩 중입니다\. 잠시 후 다시 시도해주세요\.'\); return; \}/g,
    `if (typeof CFB === 'undefined') { void appAlert({ type: 'info', message: '수정 라이브러리(CFB) 로딩 중입니다.\\n잠시 후 다시 시도해 주세요.' }); return; }`,
  );

  s = s.replace(
    /if \(!hwpFiles\.length\) \{ alert\('업로드된 hwp 파일이 없습니다\.'\); return; \}/g,
    `if (!hwpFiles.length) { void appAlert({ type: 'warning', message: '업로드된 HWP 파일이 없습니다.' }); return; }`,
  );

  s = s.replace(
    /alert\('사원명부\(DB\)가 연결되지 않았습니다\.\\n🔄 새로고침으로 다시 불러온 뒤 파싱해 주세요\.'\);/g,
    `void appAlert({ type: 'error', title: '사원명부 연결 실패', message: '사원명부(DB)가 연결되지 않았습니다.\\n새로고침으로 다시 불러온 뒤 파싱해 주세요.' });`,
  );

  s = s.replace(
    /alert\(`❌ \$\{file\.name\}\\n\$\{e\.message\}`\);/g,
    `void appAlert({ type: 'error', title: '파싱 오류', message: \`\${file.name}\\n\${e.message}\` });`,
  );

  s = s.replace(
    /alert\(msg\);/g,
    `void appAlert({ type: 'success', title: '수정본 생성 완료', message: msg });`,
  );

  s = s.replace(
    /\}\)\.catch\(\(\) => alert\('복사 실패: 내용을 직접 선택해 복사해주세요\.'\)\);/g,
    `}).catch(() => void appAlert({ type: 'error', message: '복사 실패: 내용을 직접 선택해 복사해 주세요.' }));`,
  );

  s = s.replace(
    /alert\('비밀번호가 올바르지 않습니다\.'\);/g,
    `void appAlert({ type: 'error', message: '비밀번호가 올바르지 않습니다.' });`,
  );

  s = s.replace(
    /if \(!date \|\| !name\) \{ alert\('날짜와 일정명을 입력해주세요\.'\); return; \}/g,
    `if (!date || !name) { void appAlert({ type: 'warning', message: '날짜와 일정명을 입력해 주세요.' }); return; }`,
  );

  return s;
}

for (const rel of files) {
  const file = path.join(root, rel);
  const before = fs.readFileSync(file, "utf8");
  const after = patch(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log("updated", rel);
  } else {
    console.log("unchanged", rel);
  }
}
