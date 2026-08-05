export const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 30;
export const MIN_INACTIVITY_TIMEOUT_MINUTES = 5;
export const MAX_INACTIVITY_TIMEOUT_MINUTES = 480;

export const INACTIVITY_TIMEOUT_OPTIONS = [
  { value: 5, label: "5분" },
  { value: 10, label: "10분" },
  { value: 15, label: "15분" },
  { value: 30, label: "30분" },
  { value: 60, label: "1시간" },
  { value: 120, label: "2시간" },
  { value: 240, label: "4시간" },
  { value: 480, label: "8시간" },
] as const;
