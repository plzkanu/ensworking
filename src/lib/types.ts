export type UserRole = "admin" | "user";

export interface User {
  id: string;
  passwordHash: string;
  name: string;
  department: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  department: string;
  role: UserRole;
}
