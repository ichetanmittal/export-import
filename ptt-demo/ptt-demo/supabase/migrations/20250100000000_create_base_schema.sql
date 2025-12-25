-- =====================================================
-- BASE SCHEMA - Create all core tables
-- This must run FIRST before organizational refactor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('importer', 'bank', 'exporter', 'funder')),
  organization VARCHAR(255),
  phone VARCHAR(50),
  bank_account_number VARCHAR(100),
  ifsc_code VARCHAR(50),
  geography VARCHAR(100),
  balance DECIMAL(20, 2) DEFAULT 0,
  credit_limit DECIMAL(20, 2) DEFAULT 0,
  credit_used DECIMAL(20, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  bank_role VARCHAR(50) CHECK (bank_role IN ('maker', 'checker', 'admin')),
  funder_role VARCHAR(50) CHECK (funder_role IN ('maker', 'checker', 'admin')),
  my_bank_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization);

-- =====================================================
-- 2. PTT TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ptt_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ptt_number VARCHAR(100) UNIQUE NOT NULL,
  issuer_bank_id UUID NOT NULL REFERENCES users(id),
  current_owner_id UUID NOT NULL REFERENCES users(id),
  original_importer_id UUID NOT NULL REFERENCES users(id),
  exporter_id UUID REFERENCES users(id),
  exporter_bank_id UUID REFERENCES users(id),
  amount DECIMAL(20, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) NOT NULL CHECK (status IN ('requested', 'issued', 'locked', 'transferred', 'redeemable', 'discounted', 'settled', 'cancelled')),
  maturity_date DATE NOT NULL,
  backing_type VARCHAR(50) CHECK (backing_type IN ('treasury', 'od_limit', 'credit')),
  trade_description TEXT,
  incoterms VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ptt_tokens_ptt_number ON ptt_tokens(ptt_number);
CREATE INDEX idx_ptt_tokens_issuer_bank ON ptt_tokens(issuer_bank_id);
CREATE INDEX idx_ptt_tokens_current_owner ON ptt_tokens(current_owner_id);
CREATE INDEX idx_ptt_tokens_original_importer ON ptt_tokens(original_importer_id);
CREATE INDEX idx_ptt_tokens_status ON ptt_tokens(status);

-- =====================================================
-- 3. PTT CONDITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ppt_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
  condition_type VARCHAR(50) NOT NULL CHECK (condition_type IN ('time', 'action', 'data')),
  condition_key VARCHAR(255) NOT NULL,
  condition_value TEXT NOT NULL,
  is_met BOOLEAN DEFAULT false,
  met_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ppt_conditions_ptt_id ON ppt_conditions(ptt_id);

-- =====================================================
-- 4. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL REFERENCES users(id),
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('invoice', 'bill_of_lading', 'ebl', 'awb', 'shipping_bill', 'packing_list', 'other')),
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_kb INTEGER,
  approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by_id UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_ptt_id ON documents(ptt_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by_id);

-- =====================================================
-- 5. PTT TRANSFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ppt_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('issuance', 'conditional_payment', 'discounting', 'settlement')),
  amount DECIMAL(20, 2),
  notes TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ppt_transfers_ptt_id ON ppt_transfers(ptt_id);

-- =====================================================
-- 6. DISCOUNTING OFFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS discounting_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
  exporter_id UUID NOT NULL REFERENCES users(id),
  asking_price DECIMAL(20, 2) NOT NULL,
  discount_rate DECIMAL(5, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'accepted', 'paid', 'cancelled')),
  funder_id UUID REFERENCES users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discounting_offers_ptt_id ON discounting_offers(ptt_id);
CREATE INDEX idx_discounting_offers_exporter ON discounting_offers(exporter_id);
CREATE INDEX idx_discounting_offers_status ON discounting_offers(status);

-- =====================================================
-- 7. SETTLEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
  payer_bank_id UUID NOT NULL REFERENCES users(id),
  beneficiary_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(20, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'triggered', 'paid', 'confirmed', 'completed', 'failed')),
  scheduled_date DATE NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  payment_reference VARCHAR(255),
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlements_ptt_id ON settlements(ptt_id);
CREATE INDEX idx_settlements_payer_bank ON settlements(payer_bank_id);
CREATE INDEX idx_settlements_status ON settlements(status);

-- =====================================================
-- 8. PENDING BANK ACTIONS TABLE (Maker-Checker)
-- =====================================================
CREATE TABLE IF NOT EXISTS pending_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('issue_ptt', 'settle_ptt', 'accept_offer')),
  ptt_id UUID REFERENCES ptt_tokens(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  action_data JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pending_actions_status ON pending_actions(status);
CREATE INDEX idx_pending_actions_initiated_by ON pending_actions(initiated_by);

-- =====================================================
-- 9. BLACKLISTED ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blacklisted_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name VARCHAR(255) NOT NULL UNIQUE,
  blacklisted_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blacklisted_organizations_name ON blacklisted_organizations(organization_name);

-- =====================================================
-- 10. USER CONNECTIONS TABLE
-- =====================================================
-- Note: connection_invitations will be created by migration 20250103000000
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  importer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(importer_id, exporter_id)
);

CREATE INDEX idx_user_connections_importer ON user_connections(importer_id);
CREATE INDEX idx_user_connections_exporter ON user_connections(exporter_id);

-- =====================================================
-- STORED PROCEDURES - User Level Operations
-- =====================================================

-- Get user balance
CREATE OR REPLACE FUNCTION get_balance(user_id_param UUID)
RETURNS DECIMAL(20, 2) AS $$
DECLARE
  user_balance DECIMAL(20, 2);
BEGIN
  SELECT balance INTO user_balance FROM users WHERE id = user_id_param;
  RETURN COALESCE(user_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Increment user balance
CREATE OR REPLACE FUNCTION increment_balance(user_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID AS $$
BEGIN
  UPDATE users SET balance = balance + amount_param WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Decrement user balance
CREATE OR REPLACE FUNCTION decrement_balance(user_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID AS $$
BEGIN
  UPDATE users SET balance = balance - amount_param WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Get available credit
CREATE OR REPLACE FUNCTION get_available_credit(user_id_param UUID)
RETURNS DECIMAL(20, 2) AS $$
DECLARE
  credit_limit_val DECIMAL(20, 2);
  credit_used_val DECIMAL(20, 2);
BEGIN
  SELECT credit_limit, credit_used INTO credit_limit_val, credit_used_val
  FROM users WHERE id = user_id_param;
  RETURN COALESCE(credit_limit_val, 0) - COALESCE(credit_used_val, 0);
END;
$$ LANGUAGE plpgsql;

-- Set credit limit
CREATE OR REPLACE FUNCTION set_credit_limit(user_id_param UUID, new_limit DECIMAL(20, 2))
RETURNS VOID AS $$
BEGIN
  UPDATE users SET credit_limit = new_limit WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Increment credit used
CREATE OR REPLACE FUNCTION increment_credit_used(user_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID AS $$
BEGIN
  UPDATE users SET credit_used = credit_used + amount_param WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Decrement credit used
CREATE OR REPLACE FUNCTION decrement_credit_used(user_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID AS $$
BEGIN
  UPDATE users SET credit_used = credit_used - amount_param WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ptt_tokens_updated_at BEFORE UPDATE ON ptt_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounting_offers_updated_at BEFORE UPDATE ON discounting_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_actions_updated_at BEFORE UPDATE ON pending_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blacklisted_organizations_updated_at BEFORE UPDATE ON blacklisted_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Base schema creation complete!
-- =====================================================
