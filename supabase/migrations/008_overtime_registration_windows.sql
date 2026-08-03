CREATE TABLE ens_overtime_registration_windows (
  overtime_type text PRIMARY KEY CHECK (overtime_type IN ('regular', 'flexible')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NULL REFERENCES ens_users(id) ON DELETE SET NULL
);

ALTER TABLE ens_overtime_registration_windows DISABLE ROW LEVEL SECURITY;

INSERT INTO ens_overtime_registration_windows (overtime_type, starts_at, ends_at, enabled)
VALUES
  ('regular', now(), now() + interval '7 days', false),
  ('flexible', now(), now() + interval '7 days', false)
ON CONFLICT (overtime_type) DO NOTHING;
