import { createClient } from '@/lib/supabase/server';
import { InterBankLimit, InterBankLimitWithDetails } from '@/lib/types/database';

// Get inter-bank limit by ID
export async function getInterBankLimitById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as InterBankLimit;
}

// Get inter-bank limit with details
export async function getInterBankLimitWithDetails(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .select(`
      *,
      issuing_bank:issuing_bank_id(*),
      financing_bank:financing_bank_id(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as InterBankLimitWithDetails;
}

// Get inter-bank limit between two banks
export async function getInterBankLimit(
  issuing_bank_id: string,
  financing_bank_id: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .select('*')
    .eq('issuing_bank_id', issuing_bank_id)
    .eq('financing_bank_id', financing_bank_id)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data as InterBankLimit;
}

// Get all financing banks for an issuing bank
export async function getFinancingBanks(issuing_bank_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .select(`
      *,
      financing_bank:financing_bank_id(*)
    `)
    .eq('issuing_bank_id', issuing_bank_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as InterBankLimitWithDetails[];
}

// Get all issuing banks for a financing bank
export async function getIssuingBanks(financing_bank_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .select(`
      *,
      issuing_bank:issuing_bank_id(*)
    `)
    .eq('financing_bank_id', financing_bank_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as InterBankLimitWithDetails[];
}

// Create inter-bank limit
export async function createInterBankLimit(data: {
  issuing_bank_id: string;
  financing_bank_id: string;
  credit_limit: number;
}) {
  const supabase = await createClient();

  // Prevent self-referencing
  if (data.issuing_bank_id === data.financing_bank_id) {
    throw new Error('Issuing bank and financing bank cannot be the same');
  }

  const { data: interBankLimit, error } = await supabase
    .from('inter_bank_limits')
    .insert({
      issuing_bank_id: data.issuing_bank_id,
      financing_bank_id: data.financing_bank_id,
      credit_limit: data.credit_limit,
      credit_used: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return interBankLimit as InterBankLimit;
}

// Update inter-bank limit
export async function updateInterBankLimit(
  id: string,
  updates: Partial<InterBankLimit>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InterBankLimit;
}

// Set inter-bank credit limit
export async function setInterBankCreditLimit(id: string, new_limit: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .update({ credit_limit: new_limit })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InterBankLimit;
}

// Get available inter-bank credit
export async function getInterBankAvailableCredit(id: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .select('credit_limit, credit_used')
    .eq('id', id)
    .single();

  if (error) throw error;

  const limit = data as InterBankLimit;
  return limit.credit_limit - limit.credit_used;
}

// Increment inter-bank credit used
export async function incrementInterBankCredit(id: string, amount: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('inter_bank_limits')
    .update({
      credit_used: supabase.rpc('increment', { amount }),
    })
    .eq('id', id);

  if (error) {
    // Fallback: manual increment
    const { data: current } = await supabase
      .from('inter_bank_limits')
      .select('credit_used')
      .eq('id', id)
      .single();

    if (current) {
      await supabase
        .from('inter_bank_limits')
        .update({ credit_used: (current as InterBankLimit).credit_used + amount })
        .eq('id', id);
    }
  }
}

// Decrement inter-bank credit used
export async function decrementInterBankCredit(id: string, amount: number) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('inter_bank_limits')
    .select('credit_used')
    .eq('id', id)
    .single();

  if (current) {
    const newValue = Math.max(0, (current as InterBankLimit).credit_used - amount);
    await supabase
      .from('inter_bank_limits')
      .update({ credit_used: newValue })
      .eq('id', id);
  }
}

// Deactivate inter-bank limit
export async function deactivateInterBankLimit(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InterBankLimit;
}

// Reactivate inter-bank limit
export async function reactivateInterBankLimit(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inter_bank_limits')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InterBankLimit;
}
