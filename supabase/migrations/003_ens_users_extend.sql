-- 사용자 테이블 확장: 사번, 직급, 역할 FK
ALTER TABLE ens_users
  ADD COLUMN IF NOT EXISTS employee_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT '';

-- 기존 role 값 마이그레이션 (user → monitoring)
UPDATE ens_users SET role = 'monitoring' WHERE role = 'user';

-- role CHECK 제약 제거 후 FK로 전환
ALTER TABLE ens_users DROP CONSTRAINT IF EXISTS ens_users_role_check;

ALTER TABLE ens_users
  ADD CONSTRAINT ens_users_role_fkey
  FOREIGN KEY (role) REFERENCES ens_roles (code);
