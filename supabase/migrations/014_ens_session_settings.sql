CREATE TABLE ens_session_settings (
  id text PRIMARY KEY DEFAULT 'default',
  inactivity_timeout_minutes integer NOT NULL DEFAULT 30
    CHECK (inactivity_timeout_minutes >= 5 AND inactivity_timeout_minutes <= 480),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NULL REFERENCES ens_users(id) ON DELETE SET NULL
);

ALTER TABLE ens_session_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO ens_session_settings (id, inactivity_timeout_minutes)
VALUES ('default', 30)
ON CONFLICT (id) DO NOTHING;
