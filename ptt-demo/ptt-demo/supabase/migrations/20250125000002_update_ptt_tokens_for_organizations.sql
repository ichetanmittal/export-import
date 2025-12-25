-- =====================================================
-- UPDATE PTT TOKENS: Reference organizations for banks
-- Created: 2025-01-25
-- Purpose: Fix PTT tokens to reference bank organizations
-- =====================================================

-- Step 1: Add new columns for organization references
-- =====================================================
ALTER TABLE ptt_tokens
  ADD COLUMN IF NOT EXISTS issuer_bank_org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS exporter_bank_org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS original_importer_org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS exporter_org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS bank_client_id UUID REFERENCES bank_clients(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ptt_issuer_bank_org ON ptt_tokens(issuer_bank_org_id);
CREATE INDEX IF NOT EXISTS idx_ptt_exporter_bank_org ON ptt_tokens(exporter_bank_org_id);
CREATE INDEX IF NOT EXISTS idx_ptt_importer_org ON ptt_tokens(original_importer_org_id);
CREATE INDEX IF NOT EXISTS idx_ptt_exporter_org ON ptt_tokens(exporter_org_id);
CREATE INDEX IF NOT EXISTS idx_ptt_bank_client ON ptt_tokens(bank_client_id);

COMMENT ON COLUMN ptt_tokens.issuer_bank_org_id IS 'Reference to issuing bank organization';
COMMENT ON COLUMN ptt_tokens.exporter_bank_org_id IS 'Reference to exporter bank organization';
COMMENT ON COLUMN ptt_tokens.original_importer_org_id IS 'Reference to importer organization';
COMMENT ON COLUMN ptt_tokens.exporter_org_id IS 'Reference to exporter organization';
COMMENT ON COLUMN ptt_tokens.bank_client_id IS 'Reference to bank-client relationship for this PTT';


-- Step 2: Migrate existing PTT data to use organization references
-- =====================================================

-- Update issuer_bank_org_id
UPDATE ptt_tokens ptt
SET issuer_bank_org_id = u.organization_id
FROM users u
WHERE ptt.issuer_bank_id = u.id
  AND u.organization_id IS NOT NULL
  AND ptt.issuer_bank_org_id IS NULL;

-- Update exporter_bank_org_id
UPDATE ptt_tokens ptt
SET exporter_bank_org_id = u.organization_id
FROM users u
WHERE ptt.exporter_bank_id = u.id
  AND u.organization_id IS NOT NULL
  AND ptt.exporter_bank_org_id IS NULL;

-- Update original_importer_org_id
UPDATE ptt_tokens ptt
SET original_importer_org_id = u.organization_id
FROM users u
WHERE ptt.original_importer_id = u.id
  AND u.organization_id IS NOT NULL
  AND ptt.original_importer_org_id IS NULL;

-- Update exporter_org_id
UPDATE ptt_tokens ptt
SET exporter_org_id = u.organization_id
FROM users u
WHERE ptt.exporter_id = u.id
  AND u.organization_id IS NOT NULL
  AND ptt.exporter_org_id IS NULL;


-- Step 3: Link PTTs to bank_clients relationship
-- =====================================================
UPDATE ptt_tokens ptt
SET bank_client_id = bc.id
FROM bank_clients bc
WHERE ptt.issuer_bank_org_id = bc.bank_org_id
  AND ptt.original_importer_org_id = bc.client_org_id
  AND ptt.bank_client_id IS NULL;


-- Step 4: Update settlements table to reference organizations
-- =====================================================
ALTER TABLE settlements
  ADD COLUMN IF NOT EXISTS payer_bank_org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS beneficiary_org_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_settlements_payer_org ON settlements(payer_bank_org_id);
CREATE INDEX IF NOT EXISTS idx_settlements_beneficiary_org ON settlements(beneficiary_org_id);

-- Migrate settlement data
UPDATE settlements s
SET payer_bank_org_id = u.organization_id
FROM users u
WHERE s.payer_bank_id = u.id
  AND u.organization_id IS NOT NULL
  AND s.payer_bank_org_id IS NULL;

UPDATE settlements s
SET beneficiary_org_id = u.organization_id
FROM users u
WHERE s.beneficiary_id = u.id
  AND u.organization_id IS NOT NULL
  AND s.beneficiary_org_id IS NULL;


-- Step 5: Update discounting_offers to reference organizations
-- =====================================================
ALTER TABLE discounting_offers
  ADD COLUMN IF NOT EXISTS exporter_org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS funder_org_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_offers_exporter_org ON discounting_offers(exporter_org_id);
CREATE INDEX IF NOT EXISTS idx_offers_funder_org ON discounting_offers(funder_org_id);

-- Migrate discounting_offers data
UPDATE discounting_offers o
SET exporter_org_id = u.organization_id
FROM users u
WHERE o.exporter_id = u.id
  AND u.organization_id IS NOT NULL
  AND o.exporter_org_id IS NULL;

UPDATE discounting_offers o
SET funder_org_id = u.organization_id
FROM users u
WHERE o.funder_id = u.id
  AND u.organization_id IS NOT NULL
  AND o.funder_org_id IS NULL;


-- =====================================================
-- VERIFICATION QUERIES (Comment out in production)
-- =====================================================

-- Check PTTs with organization references
-- SELECT
--   ptt.ptt_number,
--   issuer.name as issuer_bank,
--   importer.name as importer,
--   exporter.name as exporter,
--   ptt.amount,
--   ptt.status
-- FROM ptt_tokens ptt
-- LEFT JOIN organizations issuer ON ptt.issuer_bank_org_id = issuer.id
-- LEFT JOIN organizations importer ON ptt.original_importer_org_id = importer.id
-- LEFT JOIN organizations exporter ON ptt.exporter_org_id = exporter.id
-- LIMIT 10;

-- Check settlements with organization references
-- SELECT
--   s.payment_reference,
--   payer.name as payer_bank,
--   beneficiary.name as beneficiary,
--   s.amount,
--   s.status
-- FROM settlements s
-- LEFT JOIN organizations payer ON s.payer_bank_org_id = payer.id
-- LEFT JOIN organizations beneficiary ON s.beneficiary_org_id = beneficiary.id
-- LIMIT 10;

-- =====================================================
-- Migration complete!
-- =====================================================

COMMENT ON TABLE ptt_tokens IS 'PTT tokens now reference organizations for banks and companies';
COMMENT ON TABLE settlements IS 'Settlements now reference bank and beneficiary organizations';
COMMENT ON TABLE discounting_offers IS 'Discounting offers now reference exporter and funder organizations';
