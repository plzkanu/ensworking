CREATE TABLE ens_erp_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overtime_type text NOT NULL CHECK (overtime_type IN ('regular', 'flexible')),
  user_id text NOT NULL REFERENCES ens_users(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT '',
  year_month text NOT NULL,
  record_count integer NOT NULL DEFAULT 0,
  person_count integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ens_erp_submissions_type_month
  ON ens_erp_submissions(overtime_type, year_month DESC);

CREATE INDEX idx_ens_erp_submissions_user_created
  ON ens_erp_submissions(user_id, created_at DESC);

CREATE INDEX idx_ens_erp_submissions_created
  ON ens_erp_submissions(created_at DESC);

ALTER TABLE ens_erp_submissions DISABLE ROW LEVEL SECURITY;
