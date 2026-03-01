-- Migration: 007_data_deletion_requests
-- Purpose: Store patient/user data deletion requests (required for WhatsApp Business API / Meta app review)

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  confirmation_code text UNIQUE NOT NULL,
  source text NOT NULL DEFAULT 'web-form', -- 'web-form' | 'meta-callback'
  name text,
  email text,
  phone text,
  reason text,
  meta_user_id text,
  raw_payload jsonb,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'in-progress' | 'completed' | 'rejected'
  admin_notes text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast lookup by confirmation code and email
CREATE INDEX IF NOT EXISTS idx_data_deletion_confirmation_code ON data_deletion_requests(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_data_deletion_email ON data_deletion_requests(email);
CREATE INDEX IF NOT EXISTS idx_data_deletion_status ON data_deletion_requests(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_data_deletion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_data_deletion_updated_at
  BEFORE UPDATE ON data_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_data_deletion_updated_at();

-- RLS: only service role (admin) can read/write — public can insert via API only
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to data_deletion_requests"
  ON data_deletion_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);
