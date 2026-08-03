/** 역할 코드 (ens_roles.code) */
export type RoleCode = string;

export interface Role {
  code: RoleCode;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  passwordHash: string;
  employeeNumber: string;
  name: string;
  position: string;
  department: string;
  role: RoleCode;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

/** API/화면용 (비밀번호 해시 제외) */
export interface UserPublic {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  department: string;
  role: RoleCode;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  employeeNumber: string;
  position: string;
  department: string;
  role: RoleCode;
}

export interface UserAccessStatus {
  userId: string;
  userName: string;
  department: string;
  role: RoleCode;
  active: boolean;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  lastLoginIp: string;
  isOnline: boolean;
  loginCount30d: number;
  lastActivityAt: string | null;
  lastActivityResource: string;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  detail: string;
  ipAddress: string;
  createdAt: string;
}

export type OvertimeType = "regular" | "flexible";

export interface ErpSubmissionDayEntry {
  start: string;
  end: string;
  hours: number;
  night_work: boolean;
  holiday_early: boolean;
  converted?: boolean;
}

export interface ErpSubmissionPersonBlock {
  name: string;
  empno: string;
  dept: string;
  workType: string;
  slots: Array<Record<string, ErpSubmissionDayEntry>>;
}

export interface ErpSubmissionPayload {
  year: number;
  month: number;
  yearMonth: string;
  dates: string[];
  personBlocks: ErpSubmissionPersonBlock[];
}

export interface ErpSubmission {
  id: string;
  overtimeType: OvertimeType;
  userId: string;
  userName: string;
  yearMonth: string;
  recordCount: number;
  personCount: number;
  payload: ErpSubmissionPayload;
  createdAt: string;
}

export interface OvertimeRegistrationWindow {
  overtimeType: OvertimeType;
  startsAt: string;
  endsAt: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

export interface OvertimeWindowStatus {
  overtimeType: OvertimeType;
  label: string;
  configured: boolean;
  enabled: boolean;
  open: boolean;
  startsAt: string | null;
  endsAt: string | null;
  message: string;
}

export {
  formatOvertimeWindowRange,
  formatOvertimeWindowRangeForDisplay,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "./overtime-window-utils";

export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    employeeNumber: user.employeeNumber,
    name: user.name,
    position: user.position,
    department: user.department,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    employeeNumber: user.employeeNumber,
    position: user.position,
    department: user.department,
    role: user.role,
  };
}

/** ERP 사원명부 (employee_directory) */
export interface EmployeeDirectoryEntry {
  empId: string;
  name: string;
  dept: string;
  position: string;
  empType: string;
  retireDate: string;
  syncedAt: string | null;
}
