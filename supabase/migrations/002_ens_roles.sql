-- 역할 마스터 테이블 (코드 기반 운영)
CREATE TABLE IF NOT EXISTS ens_roles (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ens_roles DISABLE ROW LEVEL SECURITY;

-- 기본 역할 시드
INSERT INTO ens_roles (code, name, description, sort_order) VALUES
  ('admin', '관리자', '시스템 전체 관리 권한', 1),
  ('office_manager', '사업소담당자', '사업소 단위 업무 담당', 2),
  ('monitoring', '모니터링', '모니터링 및 조회 권한', 3)
ON CONFLICT (code) DO NOTHING;
