import { createClient } from '@/lib/supabase/server';
import { BankClient, BankClientWithDetails, BankClientRelationshipType } from '@/lib/types/database';

// Get bank-client relationship by ID
export async function getBankClientById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bank_clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as BankClient;
}

// Get bank-client relationship with details
export async function getBankClientWithDetails(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bank_clients')
    .select(`
      *,
      bank_org:bank_org_id(*),
      client_org:client_org_id(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as BankClientWithDetails;
}

// Get all clients for a bank organization
export async function getClientsForBank(
  bank_org_id: string,
  relationship_type?: BankClientRelationshipType
) {
  const supabase = await createClient();

  let query = supabase
    .from('bank_clients')
    .select(`
      *,
      client_org:client_org_id(*)
    `)
    .eq('bank_org_id', bank_org_id)
    .eq('is_active', true);

  if (relationship_type) {
    query = query.or(`relationship_type.eq.${relationship_type},relationship_type.eq.both`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as BankClientWithDetails[];
}

// Get all banks for a client organization
export async function getBanksForClient(
  client_org_id: string,
  relationship_type?: BankClientRelationshipType
) {
  const supabase = await createClient();

  let query = supabase
    .from('bank_clients')
    .select(`
      *,
      bank_org:bank_org_id(*)
    `)
    .eq('client_org_id', client_org_id)
    .eq('is_active', true);

  if (relationship_type) {
    query = query.or(`relationship_type.eq.${relationship_type},relationship_type.eq.both`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as BankClientWithDetails[];
}

// Create bank-client relationship
export async function createBankClient(data: {
  bank_org_id: string;
  client_org_id: string;
  relationship_type: BankClientRelationshipType;
  credit_limit?: number;
}) {
  const supabase = await createClient();

  const { data: bankClient, error } = await supabase
    .from('bank_clients')
    .insert({
      bank_org_id: data.bank_org_id,
      client_org_id: data.client_org_id,
      relationship_type: data.relationship_type,
      credit_limit: data.credit_limit || 0,
      credit_used: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return bankClient as BankClient;
}

// Update bank-client relationship
export async function updateBankClient(
  id: string,
  updates: Partial<BankClient>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bank_clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BankClient;
}

// Set credit limit for bank-client
export async function setBankClientCreditLimit(
  id: string,
  new_limit: number
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bank_clients')
    .update({ credit_limit: new_limit })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BankClient;
}

// Get available credit for bank-client
export async function getBankClientAvailableCredit(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_bank_client_available_credit', {
    bank_client_id_param: id,
  });

  if (error) throw error;
  return data as number;
}

// Increment bank-client credit used
export async function incrementBankClientCredit(id: string, amount: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_bank_client_credit', {
    bank_client_id_param: id,
    amount_param: amount,
  });

  if (error) throw error;
}

// Decrement bank-client credit used
export async function decrementBankClientCredit(id: string, amount: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('decrement_bank_client_credit', {
    bank_client_id_param: id,
    amount_param: amount,
  });

  if (error) throw error;
}

// Deactivate bank-client relationship
export async function deactivateBankClient(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bank_clients')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BankClient;
}

// Reactivate bank-client relationship
export async function reactivateBankClient(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bank_clients')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BankClient;
}
