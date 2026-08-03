export type ErpFormVersion = "list" | "erp";

export interface ErpFormVersionOption {
  id: ErpFormVersion;
  label: string;
  sheetName: string;
}

export const ERP_FORM_VERSIONS: ErpFormVersionOption[] = [
  {
    id: "list",
    label: "입력목록",
    sheetName: "시간외근무_입력목록",
  },
  {
    id: "erp",
    label: "ERP 양식",
    sheetName: "시간외근무신청",
  },
];

export function getErpFormVersion(id: string): ErpFormVersion {
  return id === "erp" ? "erp" : "list";
}
