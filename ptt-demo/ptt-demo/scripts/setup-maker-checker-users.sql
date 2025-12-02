-- Setup Maker and Checker Users for Bank
-- Run this in your Supabase SQL Editor

-- 1. Update existing bank user to be a MAKER
UPDATE users
SET bank_role = 'maker'
WHERE email = 'bank@demo.com'
AND role = 'bank';

-- 2. Check if checker user already exists, if not create one
-- First, let's check the existing bank user to get organization and other details
DO $$
DECLARE
  bank_org TEXT;
  checker_exists BOOLEAN;
BEGIN
  -- Get organization from existing bank user
  SELECT organization INTO bank_org
  FROM users
  WHERE email = 'bank@demo.com'
  LIMIT 1;

  -- Check if checker user already exists
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'checker@demo.com') INTO checker_exists;

  IF NOT checker_exists THEN
    -- Create checker user (password hash is for 'Demo@123')
    INSERT INTO users (
      email,
      password_hash,
      name,
      role,
      organization,
      bank_role,
      balance,
      credit_limit,
      credit_used,
      is_active
    ) VALUES (
      'checker@demo.com',
      '$2b$10$rXvN9YwvGHx3FkqGZGqB4.FkPVEWZXqX0qKGZGqB4.FkPVEWZXqX0', -- Hash for 'Demo@123'
      'Bank Checker',
      'bank',
      COALESCE(bank_org, 'ICICI Bank'),
      'checker',
      10000000,
      0,
      0,
      true
    );

    RAISE NOTICE 'Checker user created successfully!';
  ELSE
    -- Update existing checker user to ensure bank_role is set
    UPDATE users
    SET bank_role = 'checker',
        role = 'bank',
        organization = COALESCE(bank_org, organization)
    WHERE email = 'checker@demo.com';

    RAISE NOTICE 'Checker user already exists - updated bank_role';
  END IF;
END $$;

-- 3. Verify the setup
SELECT
  email,
  name,
  role,
  bank_role,
  organization,
  balance
FROM users
WHERE email IN ('bank@demo.com', 'checker@demo.com')
ORDER BY email;
