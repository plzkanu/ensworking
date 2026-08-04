import { ProgramFeedbackPanel } from "@/components/feedback/program-feedback-panel";

export default function ProgramFeedbackSubmitPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">프로그램 의견 제출</h1>
        <p className="mt-2 text-sm text-slate-600">
          수정요청, 기능개선, 오류신고 등 프로그램 관련 의견을 등록합니다.
        </p>
      </div>
      <ProgramFeedbackPanel />
    </div>
  );
}
