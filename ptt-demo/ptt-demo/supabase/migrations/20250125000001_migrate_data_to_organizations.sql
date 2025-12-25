-- =====================================================
-- DATA MIGRATION: Move existing users to organizations
-- Created: 2025-01-25
-- Purpose: Migrate existing data to new organization model
-- =====================================================

-- Step 1: Create organizations from unique user organizations
-- =====================================================
INSERT INTO organizations (
  name,
  type,
  treasury_balance,
  credit_limit,
  credit_used,
  email,
  phone,
  geography,
  bank_account_number,
  ifsc_code,
  is_active,
  created_at
)
SELECT DISTINCT
  u.organization AS name,
  u.role AS type,
  -- Aggregate balances for organizations with multiple users
  COALESCE((
    SELECT SUM(balance)
    FROM users u2
    WHERE u2.organization = u.organization AND u2.role = u.role
  ), 0) AS treasury_balance,
  -- Use max credit_limit from users in same org
  COALESCE((
    SELECT MAX(credit_limit)
    FROM users u2
    WHERE u2.organization = u.organization AND u2.role = u.role
  ), 0) AS credit_limit,
  -- Aggregate credit_used
  COALESCE((
    SELECT SUM(credit_used)
    FROM users u2
    WHERE u2.organization = u.organization AND u2.role = u.role
  ), 0) AS credit_used,
  -- Take contact info from first user (will be updated later)
  (
    SELECT email
    FROM users u2
    WHERE u2.organization = u.organization AND u2.role = u.role
    LIMIT 1
  ) AS email,
  (
    SELECT phone
    FROM users u2
    WHERE u2.organization = u.organization AND u2.role = u.role
    LIMIT 1
  ) AS phone,
  (
    SELECT geography
    FROM users u2
    WHERE u2.organization = u.organization AND u2.role = u.role
    LIMIT 1
  ) AS geography,
  (
    SELECT bank_account_number
    FROM users u2
    WHERE u2.organization = u.organization AND u2.role = u.role
    LIMIT 1
  ) AS bank_account_number,
  (
    SELECT ifsc_code
    FROM users u2
    WHERE u2.organization = u.organization AND u2.role = u.role
    LIMIT 1
  ) AS ifsc_code,
  true AS is_active,
  MIN(u.created_at) AS created_at
FROM users u
WHERE u.organization IS NOT NULL
GROUP BY u.organization, u.role
ON CONFLICT (name) DO NOTHING;


-- Step 2: Update users table with organization_id references
-- =====================================================
UPDATE users u
SET organization_id = o.id
FROM organizations o
WHERE u.organization = o.name
  AND u.role = o.type
  AND u.organization_id IS NULL;


-- Step 3: Set POC (Point of Contact) flag for first user of each org
-- =====================================================
WITH first_users AS (
  SELECT DISTINCT ON (organization_id)
    id,
    organization_id
  FROM users
  WHERE organization_id IS NOT NULL
  ORDER BY organization_id, created_at ASC
)
UPDATE users u
SET is_poc = true
FROM first_users fu
WHERE u.id = fu.id;


-- Step 4: Update organizations with POC details
-- =====================================================
UPDATE organizations o
SET
  poc_name = u.name,
  poc_email = u.email,
  poc_phone = u.phone
FROM users u
WHERE u.organization_id = o.id
  AND u.is_poc = true;


-- Step 5: Create bank-client relationships from existing PTT requests
-- =====================================================
-- This creates relationships based on existing PTT tokens
-- Banks that have issued PTTs for importers become their issuing banks

INSERT INTO bank_clients (
  bank_org_id,
  client_org_id,
  relationship_type,
  credit_limit,
  credit_used,
  is_active
)
SELECT DISTINCT
  bank_org.id AS bank_org_id,
  client_org.id AS client_org_id,
  'issuing' AS relationship_type,
  COALESCE(client_org.credit_limit, 0) AS credit_limit,
  COALESCE(client_org.credit_used, 0) AS credit_used,
  true AS is_active
FROM ptt_tokens ptt
JOIN users bank_user ON ptt.issuer_bank_id = bank_user.id
JOIN users client_user ON ptt.original_importer_id = client_user.id
JOIN organizations bank_org ON bank_user.organization_id = bank_org.id
JOIN organizations client_org ON client_user.organization_id = client_org.id
WHERE bank_org.type = 'bank'
  AND client_org.type = 'importer'
ON CONFLICT (bank_org_id, client_org_id) DO NOTHING;


-- Step 6: Create financing relationships from discounting offers
-- =====================================================
-- Funders who have accepted discount offers become financing banks for exporters

INSERT INTO bank_clients (
  bank_org_id,
  client_org_id,
  relationship_type,
  credit_limit,
  credit_used,
  is_active
)
SELECT DISTINCT
  funder_org.id AS bank_org_id,
  exporter_org.id AS client_org_id,
  'financing' AS relationship_type,
  0 AS credit_limit,
  0 AS credit_used,
  true AS is_active
FROM discounting_offers offer
JOIN users funder_user ON offer.funder_id = funder_user.id
JOIN users exporter_user ON offer.exporter_id = exporter_user.id
JOIN organizations funder_org ON funder_user.organization_id = funder_org.id
JOIN organizations exporter_org ON exporter_user.organization_id = exporter_org.id
WHERE funder_org.type = 'funder'
  AND exporter_org.type = 'exporter'
  AND offer.status IN ('accepted', 'paid')
ON CONFLICT (bank_org_id, client_org_id) DO NOTHING;


-- Step 7: Create user_connections based on organizations
-- =====================================================
-- Update existing user_connections to work with new model
-- (Keep existing table but it now links users from different organizations)


-- =====================================================
-- VERIFICATION QUERIES (Comment out in production)
-- =====================================================

-- Check organizations created
-- SELECT type, COUNT(*) as count, SUM(treasury_balance) as total_treasury
-- FROM organizations
-- GROUP BY type;

-- Check users linked to organizations
-- SELECT
--   o.name,
--   o.type,
--   COUNT(u.id) as user_count,
--   o.treasury_balance
-- FROM organizations o
-- LEFT JOIN users u ON u.organization_id = o.id
-- GROUP BY o.id, o.name, o.type, o.treasury_balance;

-- Check bank-client relationships
-- SELECT
--   b.name as bank_name,
--   c.name as client_name,
--   bc.relationship_type,
--   bc.credit_limit,
--   bc.credit_used
-- FROM bank_clients bc
-- JOIN organizations b ON bc.bank_org_id = b.id
-- JOIN organizations c ON bc.client_org_id = c.id;

-- =====================================================
-- Migration complete!
-- =====================================================
