-- =====================================================
-- MAJOR REFACTOR: Fix Entity/Organization Model
-- Created: 2025-01-25
-- Purpose: Fix flaws in user vs organization model
-- =====================================================

-- Step 1: Create organizations table
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'importer', 'exporter', 'funder')),

  -- Financial fields (moved from users table)
  treasury_balance DECIMAL(20, 2) DEFAULT 0,
  credit_limit DECIMAL(20, 2) DEFAULT 0,
  credit_used DECIMAL(20, 2) DEFAULT 0,

  -- Contact and details
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  geography VARCHAR(100),
  country VARCHAR(100),

  -- Banking details
  swift_code VARCHAR(20),
  bank_account_number VARCHAR(100),
  ifsc_code VARCHAR(50),

  -- License and compliance
  license_number VARCHAR(100),
  registration_number VARCHAR(100),

  -- Point of Contact (POC)
  poc_name VARCHAR(255),
  poc_email VARCHAR(255),
  poc_phone VARCHAR(50),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

COMMENT ON TABLE organizations IS 'Legal entities: banks, importer companies, exporter companies, funder organizations';
COMMENT ON COLUMN organizations.treasury_balance IS 'For banks and funders: organizational treasury';
COMMENT ON COLUMN organizations.credit_limit IS 'For importers: credit limit from their bank';


-- Step 2: Create bank_clients relationship table
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  bank_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Relationship type
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('issuing', 'financing', 'both')),

  -- Credit management
  credit_limit DECIMAL(20, 2) DEFAULT 0,
  credit_used DECIMAL(20, 2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique bank-client relationships
  UNIQUE(bank_org_id, client_org_id)
);

CREATE INDEX idx_bank_clients_bank ON bank_clients(bank_org_id);
CREATE INDEX idx_bank_clients_client ON bank_clients(client_org_id);
CREATE INDEX idx_bank_clients_type ON bank_clients(relationship_type);

COMMENT ON TABLE bank_clients IS 'Bank-client relationships for importers and exporters';


-- Step 3: Create inter_bank_limits table
-- =====================================================
CREATE TABLE IF NOT EXISTS inter_bank_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Bank relationships
  issuing_bank_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  financing_bank_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Credit line
  credit_limit DECIMAL(20, 2) DEFAULT 0,
  credit_used DECIMAL(20, 2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique inter-bank relationships
  UNIQUE(issuing_bank_id, financing_bank_id),

  -- Prevent self-referencing
  CHECK (issuing_bank_id != financing_bank_id)
);

CREATE INDEX idx_inter_bank_limits_issuing ON inter_bank_limits(issuing_bank_id);
CREATE INDEX idx_inter_bank_limits_financing ON inter_bank_limits(financing_bank_id);

COMMENT ON TABLE inter_bank_limits IS 'Credit limits between banks for PTT issuance and financing';


-- Step 4: Alter users table to add organization_id
-- =====================================================
-- Add organization_id column (nullable initially for migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

-- Add POC flag for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_poc BOOLEAN DEFAULT false;

COMMENT ON COLUMN users.organization_id IS 'Reference to the organization this user belongs to';
COMMENT ON COLUMN users.is_poc IS 'Whether this user is the Point of Contact for the organization';


-- Step 5: Migrate existing data to organizations
-- =====================================================
-- This will be done in a separate transaction to handle existing data
-- For now, we keep both old and new columns to ensure backward compatibility

-- Note: The actual data migration will be handled by a separate script
-- that runs after this schema change


-- Step 6: Create stored procedures for organization-level operations
-- =====================================================

-- Get organization treasury balance
CREATE OR REPLACE FUNCTION get_org_treasury(org_id_param UUID)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  balance DECIMAL(20, 2);
BEGIN
  SELECT treasury_balance INTO balance
  FROM organizations
  WHERE id = org_id_param;

  RETURN COALESCE(balance, 0);
END;
$$;

-- Increment organization treasury
CREATE OR REPLACE FUNCTION increment_org_treasury(org_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE organizations
  SET treasury_balance = treasury_balance + amount_param,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = org_id_param;
END;
$$;

-- Decrement organization treasury
CREATE OR REPLACE FUNCTION decrement_org_treasury(org_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE organizations
  SET treasury_balance = treasury_balance - amount_param,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = org_id_param;

  -- Check if balance went negative (optional constraint)
  IF (SELECT treasury_balance FROM organizations WHERE id = org_id_param) < 0 THEN
    RAISE EXCEPTION 'Insufficient treasury balance for organization %', org_id_param;
  END IF;
END;
$$;

-- Get organization available credit
CREATE OR REPLACE FUNCTION get_org_available_credit(org_id_param UUID)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  available DECIMAL(20, 2);
BEGIN
  SELECT (credit_limit - credit_used) INTO available
  FROM organizations
  WHERE id = org_id_param;

  RETURN COALESCE(available, 0);
END;
$$;

-- Increment organization credit used
CREATE OR REPLACE FUNCTION increment_org_credit_used(org_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE organizations
  SET credit_used = credit_used + amount_param,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = org_id_param;
END;
$$;

-- Decrement organization credit used
CREATE OR REPLACE FUNCTION decrement_org_credit_used(org_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE organizations
  SET credit_used = GREATEST(credit_used - amount_param, 0),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = org_id_param;
END;
$$;

-- Set organization credit limit
CREATE OR REPLACE FUNCTION set_org_credit_limit(org_id_param UUID, new_limit DECIMAL(20, 2))
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE organizations
  SET credit_limit = new_limit,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = org_id_param;
END;
$$;

-- Get bank-client available credit
CREATE OR REPLACE FUNCTION get_bank_client_available_credit(bank_client_id_param UUID)
RETURNS DECIMAL(20, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  available DECIMAL(20, 2);
BEGIN
  SELECT (credit_limit - credit_used) INTO available
  FROM bank_clients
  WHERE id = bank_client_id_param;

  RETURN COALESCE(available, 0);
END;
$$;

-- Increment bank-client credit used
CREATE OR REPLACE FUNCTION increment_bank_client_credit(bank_client_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE bank_clients
  SET credit_used = credit_used + amount_param,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = bank_client_id_param;
END;
$$;

-- Decrement bank-client credit used
CREATE OR REPLACE FUNCTION decrement_bank_client_credit(bank_client_id_param UUID, amount_param DECIMAL(20, 2))
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE bank_clients
  SET credit_used = GREATEST(credit_used - amount_param, 0),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = bank_client_id_param;
END;
$$;


-- Step 7: Disable RLS (using custom JWT auth)
-- =====================================================
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE inter_bank_limits DISABLE ROW LEVEL SECURITY;


-- Step 8: Create trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_clients_updated_at
  BEFORE UPDATE ON bank_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inter_bank_limits_updated_at
  BEFORE UPDATE ON inter_bank_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- Migration complete! Next step: Data migration script
-- =====================================================
