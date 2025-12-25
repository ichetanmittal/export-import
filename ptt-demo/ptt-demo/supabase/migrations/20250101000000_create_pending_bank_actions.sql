-- Create pending_bank_actions table for maker-checker workflow
CREATE TABLE IF NOT EXISTS pending_bank_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('issue_ptt', 'settle_ptt')),
  ptt_id UUID REFERENCES ptt_tokens(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  action_data JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add bank_role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_role VARCHAR(20) CHECK (bank_role IN ('maker', 'checker', 'admin'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_bank_actions(status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_ptt ON pending_bank_actions(ptt_id);
CREATE INDEX IF NOT EXISTS idx_pending_actions_initiated_by ON pending_bank_actions(initiated_by);

-- Note: RLS is disabled because this app uses custom JWT authentication
-- not Supabase Auth, so auth.uid() would return NULL.
-- Access control is handled at the application level.
ALTER TABLE pending_bank_actions DISABLE ROW LEVEL SECURITY;
