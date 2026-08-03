ALTER TABLE ens_erp_submissions
  ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT '';

UPDATE ens_erp_submissions s
SET department = COALESCE(u.department, '')
FROM ens_users u
WHERE s.user_id = u.id
  AND (s.department IS NULL OR s.department = '');

CREATE INDEX IF NOT EXISTS idx_ens_erp_submissions_department
  ON ens_erp_submissions(department);
