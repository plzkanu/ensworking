-- ERP 사원명부 (시간외근무 검증용)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS employee_directory (
  emp_id text NOT NULL,
  emp_name text NULL,
  dept_name text NULL,
  grp_ent_date text NULL,
  ent_date text NULL,
  retire_date text NULL,
  emp_type_name text NULL,
  position_name text NULL,
  is_deleted boolean NULL DEFAULT false,
  source text NULL DEFAULT 'erp'::text,
  synced_at timestamptz NULL DEFAULT now(),
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now(),
  CONSTRAINT employee_directory_pkey PRIMARY KEY (emp_id)
);

DROP TRIGGER IF EXISTS trg_employee_directory_updated_at ON employee_directory;
CREATE TRIGGER trg_employee_directory_updated_at
  BEFORE UPDATE ON employee_directory
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE employee_directory DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_employee_directory_is_deleted
  ON employee_directory (is_deleted);
