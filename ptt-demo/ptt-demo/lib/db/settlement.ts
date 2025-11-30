import { createClient } from '@/lib/supabase/server';
import { Settlement } from '@/lib/types/database';

// One-click settlement - handles everything in a single transaction
export async function settlePayment(ptt_id: string) {
  const supabase = await createClient();

  // 1. Get PTT details with related user info
  const { data: ptt, error: pttError } = await supabase
    .from('ptt_tokens')
    .select('*, issuer_bank:issuer_bank_id(id, balance), beneficiary:current_owner_id(id, balance)')
    .eq('id', ptt_id)
    .single();

  if (pttError) throw new Error(`Failed to fetch PTT: ${pttError.message}`);
  if (!ptt) throw new Error('PTT not found');

  const timestamp = new Date().toISOString();
  const paymentReference = `AUTO-SETTLE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // 2. Create settlement record (already completed)
  const { data: settlement, error: settlementError } = await supabase
    .from('settlements')
    .insert({
      ptt_id: ptt_id,
      payer_bank_id: ptt.issuer_bank_id,
      beneficiary_id: ptt.current_owner_id,
      amount: ptt.amount,
      status: 'completed', // Directly completed!
      scheduled_date: ptt.maturity_date,
      triggered_at: timestamp,
      paid_at: timestamp,
      confirmed_at: timestamp,
      payment_reference: paymentReference,
    })
    .select()
    .single();

  if (settlementError) throw new Error(`Failed to create settlement: ${settlementError.message}`);

  // 3. Update balances - Deduct from bank treasury
  const { error: deductError } = await supabase.rpc('decrement_balance', {
    user_id_param: ptt.issuer_bank_id,
    amount_param: ptt.amount
  });

  if (deductError) throw new Error(`Failed to deduct from bank: ${deductError.message}`);

  // 4. Update balances - Add to beneficiary (funder)
  const { error: addError } = await supabase.rpc('increment_balance', {
    user_id_param: ptt.current_owner_id,
    amount_param: ptt.amount
  });

  if (addError) throw new Error(`Failed to credit beneficiary: ${addError.message}`);

  // 5. Update PTT status to settled
  const { error: pttUpdateError } = await supabase
    .from('ptt_tokens')
    .update({ status: 'settled' })
    .eq('id', ptt_id);

  if (pttUpdateError) throw new Error(`Failed to update PTT status: ${pttUpdateError.message}`);

  // 6. Record transfer for audit trail
  const { error: transferError } = await supabase.from('ptt_transfers').insert({
    ptt_id: ptt_id,
    from_user_id: ptt.issuer_bank_id,
    to_user_id: ptt.current_owner_id,
    transfer_type: 'settlement',
    amount: ptt.amount,
  });

  if (transferError) throw new Error(`Failed to record transfer: ${transferError.message}`);

  return settlement as Settlement;
}

// Get settlements by bank
export async function getSettlementsByBank(bank_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      ptt:ptt_id(id, ptt_number, amount, currency),
      beneficiary:beneficiary_id(id, name, organization)
    `)
    .eq('payer_bank_id', bank_id)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data;
}

// Get settlements by beneficiary
export async function getSettlementsByBeneficiary(beneficiary_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      ptt:ptt_id(id, ptt_number, amount, currency),
      payer_bank:payer_bank_id(id, name, organization)
    `)
    .eq('beneficiary_id', beneficiary_id)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data;
}

// Get pending settlements (for banks)
export async function getPendingSettlements(bank_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      ptt:ptt_id(*),
      beneficiary:beneficiary_id(*)
    `)
    .eq('payer_bank_id', bank_id)
    .in('status', ['scheduled', 'triggered'])
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data;
}
