ALTER TABLE ens_admin_change_logs
  ADD COLUMN IF NOT EXISTS recorded_date date;

UPDATE ens_admin_change_logs
SET recorded_date = (created_at AT TIME ZONE 'Asia/Seoul')::date
WHERE recorded_date IS NULL;

ALTER TABLE ens_admin_change_logs
  ALTER COLUMN recorded_date SET NOT NULL,
  ALTER COLUMN recorded_date SET DEFAULT (CURRENT_DATE);

CREATE INDEX IF NOT EXISTS idx_ens_admin_change_logs_recorded
  ON ens_admin_change_logs(recorded_date DESC, created_at DESC);
