import { createClient } from '@/lib/supabase/server';
import { Settlement } from '@/lib/types/database';

// Trigger settlement
export async function triggerSettlement(data: {
  ptt_id: string;
}) {
  const supabase = await createClient();

  // Get PTT details
  const { data: ptt, error: pttError } = await supabase
    .from('ptt_tokens')
    .select('*')
    .eq('id', data.ptt_id)
    .single();

  if (pttError) throw pttError;

  // Create settlement record
  const { data: settlement, error } = await supabase
    .from('settlements')
    .insert({
      ptt_id: data.ptt_id,
      payer_bank_id: ptt.issuer_bank_id,
      beneficiary_id: ptt.current_owner_id,
      amount: ptt.amount,
      status: 'triggered',
      scheduled_date: ptt.maturity_date,
      triggered_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return settlement as Settlement;
}

// Process settlement payment
export async function processSettlementPayment(data: {
  settlement_id: string;
  payment_reference: string;
}) {
  const supabase = await createClient();

  const { data: settlement, error } = await supabase
    .from('settlements')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: data.payment_reference,
    })
    .eq('id', data.settlement_id)
    .select()
    .single();

  if (error) throw error;
  return settlement as Settlement;
}

// Confirm settlement
export async function confirmSettlement(data: {
  settlement_id: string;
}) {
  const supabase = await createClient();

  // Get settlement details
  const { data: settlement, error: settlementError } = await supabase
    .from('settlements')
    .select('*')
    .eq('id', data.settlement_id)
    .single();

  if (settlementError) throw settlementError;

  // Update settlement status
  const { error: updateError } = await supabase
    .from('settlements')
    .update({
      status: 'completed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', data.settlement_id);

  if (updateError) throw updateError;

  // Update PTT status to settled
  const { error: pttError } = await supabase
    .from('ptt_tokens')
    .update({ status: 'settled' })
    .eq('id', (settlement as Settlement).ptt_id);

  if (pttError) throw pttError;

  // Record final transfer
  await supabase.from('ptt_transfers').insert({
    ptt_id: (settlement as Settlement).ptt_id,
    from_user_id: (settlement as Settlement).payer_bank_id,
    to_user_id: (settlement as Settlement).beneficiary_id,
    transfer_type: 'settlement',
    amount: (settlement as Settlement).amount,
  });

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
