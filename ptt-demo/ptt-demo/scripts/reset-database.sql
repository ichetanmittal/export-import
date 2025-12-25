-- =====================================================
-- RESET DATABASE - Clean Everything
-- Run this in Supabase SQL Editor to start fresh
-- =====================================================

-- Step 1: Drop all existing tables (in correct order to handle dependencies)
DROP TABLE IF EXISTS pending_actions CASCADE;
DROP TABLE IF EXISTS blacklisted_organizations CASCADE;
DROP TABLE IF EXISTS connection_invitations CASCADE;
DROP TABLE IF EXISTS user_connections CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS discounting_offers CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS ppt_transfers CASCADE;
DROP TABLE IF EXISTS ppt_conditions CASCADE;
DROP TABLE IF EXISTS ptt_tokens CASCADE;
DROP TABLE IF EXISTS inter_bank_limits CASCADE;
DROP TABLE IF EXISTS bank_clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Step 2: Drop all stored procedures/functions
DROP FUNCTION IF EXISTS get_available_credit CASCADE;
DROP FUNCTION IF EXISTS set_credit_limit CASCADE;
DROP FUNCTION IF EXISTS increment_credit_used CASCADE;
DROP FUNCTION IF EXISTS decrement_credit_used CASCADE;
DROP FUNCTION IF EXISTS increment_balance CASCADE;
DROP FUNCTION IF EXISTS decrement_balance CASCADE;
DROP FUNCTION IF EXISTS get_org_treasury CASCADE;
DROP FUNCTION IF EXISTS increment_org_treasury CASCADE;
DROP FUNCTION IF EXISTS decrement_org_treasury CASCADE;
DROP FUNCTION IF EXISTS get_org_available_credit CASCADE;
DROP FUNCTION IF EXISTS increment_org_credit_used CASCADE;
DROP FUNCTION IF EXISTS decrement_org_credit_used CASCADE;
DROP FUNCTION IF EXISTS set_org_credit_limit CASCADE;
DROP FUNCTION IF EXISTS get_bank_client_available_credit CASCADE;
DROP FUNCTION IF EXISTS increment_bank_client_credit CASCADE;
DROP FUNCTION IF EXISTS decrement_bank_client_credit CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Step 3: Drop storage bucket
-- Note: You'll need to delete this manually in Supabase Dashboard > Storage
-- Bucket name: ptt-documents

-- =====================================================
-- Database is now clean!
-- Next: Run the migrations again
-- =====================================================
