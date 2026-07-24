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

export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    employeeNumber: user.employeeNumber,
    name: user.name,
    position: user.position,
    department: user.department,
    role: user.role,
    active: user.active,
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
