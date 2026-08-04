CREATE TABLE ens_admin_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL REFERENCES ens_users(id) ON DELETE CASCADE,
  admin_name text NOT NULL DEFAULT '',
  category text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL DEFAULT '',
  target_id text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ens_admin_change_logs_created
  ON ens_admin_change_logs(created_at DESC);

CREATE INDEX idx_ens_admin_change_logs_admin_created
  ON ens_admin_change_logs(admin_id, created_at DESC);

CREATE INDEX idx_ens_admin_change_logs_category_created
  ON ens_admin_change_logs(category, created_at DESC);

ALTER TABLE ens_admin_change_logs DISABLE ROW LEVEL SECURITY;
