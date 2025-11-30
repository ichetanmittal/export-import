-- Add balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 0;

-- Set initial balances for demo users
-- Banks start with large treasury balance
UPDATE users
SET balance = 10000000.00
WHERE role = 'bank';

-- Funders start with investment capital
UPDATE users
SET balance = 1000000.00
WHERE role = 'funder';

-- Importers and Exporters start with some working capital
UPDATE users
SET balance = 100000.00
WHERE role IN ('importer', 'exporter');

-- Create helper functions for balance updates
CREATE OR REPLACE FUNCTION increment_balance(user_id_param UUID, amount_param DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET balance = balance + amount_param
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_balance(user_id_param UUID, amount_param DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET balance = balance - amount_param
  WHERE id = user_id_param;

  -- Optional: Check for negative balance
  IF (SELECT balance FROM users WHERE id = user_id_param) < 0 THEN
    RAISE EXCEPTION 'Insufficient balance for user %', user_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN users.balance IS 'User account balance in base currency (USD). Updated during settlements and transactions.';
