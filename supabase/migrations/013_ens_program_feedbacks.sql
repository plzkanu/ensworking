CREATE TABLE ens_program_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES ens_users(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT '',
  user_department text NOT NULL DEFAULT '',
  category text NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'registered',
  admin_response text NOT NULL DEFAULT '',
  admin_id text NOT NULL DEFAULT '',
  admin_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ens_program_feedbacks_created
  ON ens_program_feedbacks(created_at DESC);

CREATE INDEX idx_ens_program_feedbacks_user_created
  ON ens_program_feedbacks(user_id, created_at DESC);

CREATE INDEX idx_ens_program_feedbacks_status_created
  ON ens_program_feedbacks(status, created_at DESC);

ALTER TABLE ens_program_feedbacks DISABLE ROW LEVEL SECURITY;
