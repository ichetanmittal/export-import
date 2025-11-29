-- RLS Policies for PTT Demo
-- Run this in Supabase SQL Editor AFTER running database-schema.sql

-- For demo purposes, we'll allow all operations
-- In production, you'd want stricter policies

-- Users table policies
CREATE POLICY "Allow public registration" ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view all users" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (true);

-- PTT Tokens policies
CREATE POLICY "Allow all PTT operations" ON ptt_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- PTT Conditions policies
CREATE POLICY "Allow all condition operations" ON ptt_conditions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Documents policies
CREATE POLICY "Allow all document operations" ON documents
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Transfers policies
CREATE POLICY "Allow all transfer operations" ON ptt_transfers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Discounting offers policies
CREATE POLICY "Allow all discounting operations" ON discounting_offers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Settlements policies
CREATE POLICY "Allow all settlement operations" ON settlements
  FOR ALL
  USING (true)
  WITH CHECK (true);
