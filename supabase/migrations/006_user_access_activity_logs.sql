CREATE TABLE ens_user_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES ens_users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('login', 'logout')),
  ip_address text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ens_user_access_logs_user_created
  ON ens_user_access_logs(user_id, created_at DESC);

CREATE INDEX idx_ens_user_access_logs_created
  ON ens_user_access_logs(created_at DESC);

CREATE TABLE ens_user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES ens_users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource text NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  ip_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ens_user_activity_logs_user_created
  ON ens_user_activity_logs(user_id, created_at DESC);

ALTER TABLE ens_user_access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ens_user_activity_logs DISABLE ROW LEVEL SECURITY;
