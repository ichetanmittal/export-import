import { createClient } from '@/lib/supabase/server';

// Check available credit for an importer
export async function getAvailableCredit(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_available_credit', {
    user_id_param: userId
  });

  if (error) throw new Error(`Failed to get available credit: ${error.message}`);
  return data || 0;
}

// Get credit information for a user (FIXED: now uses organization-level credit)
export async function getCreditInfo(userId: string) {
  const supabase = await createClient();

  // First, get user info with organization_id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email, organization, organization_id, role, credit_limit, credit_used')
    .eq('id', userId)
    .single();

  if (userError) throw new Error(`Failed to get user info: ${userError.message}`);

  // If user has organization_id and is an importer/exporter, get organization-level credit
  if (user.organization_id && (user.role === 'importer' || user.role === 'exporter')) {
    // Get bank-client relationship to find organization-level credit
    const { data: bankClient, error: bcError } = await supabase
      .from('bank_clients')
      .select(`
        id,
        credit_limit,
        credit_used,
        relationship_type,
        bank_org:bank_org_id(id, name)
      `)
      .eq('client_org_id', user.organization_id)
      .maybeSingle();

    if (bankClient && !bcError) {
      // Return organization-level credit from bank_clients
      return {
        ...user,
        credit_limit: bankClient.credit_limit || 0,
        credit_used: bankClient.credit_used || 0,
        available_credit: (bankClient.credit_limit || 0) - (bankClient.credit_used || 0),
        utilization_percentage: bankClient.credit_limit > 0
          ? ((bankClient.credit_used || 0) / bankClient.credit_limit) * 100
          : 0,
        bank_name: bankClient.bank_org?.name || 'Unknown Bank',
        relationship_type: bankClient.relationship_type,
      };
    }
  }

  // Fallback to user-level credit (legacy)
  return {
    ...user,
    credit_limit: user.credit_limit || 0,
    credit_used: user.credit_used || 0,
    available_credit: (user.credit_limit || 0) - (user.credit_used || 0),
    utilization_percentage: user.credit_limit > 0
      ? ((user.credit_used || 0) / user.credit_limit) * 100
      : 0,
    bank_name: null,
    relationship_type: null,
  };
}

// Set credit limit for an importer (bank function)
export async function setCreditLimit(userId: string, newLimit: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('set_credit_limit', {
    user_id_param: userId,
    new_limit: newLimit
  });

  if (error) throw new Error(`Failed to set credit limit: ${error.message}`);

  return { success: true };
}

// Increment credit used (when PTT is issued)
export async function incrementCreditUsed(userId: string, amount: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_credit_used', {
    user_id_param: userId,
    amount_param: amount
  });

  if (error) throw new Error(`Failed to increment credit used: ${error.message}`);
}

// Decrement credit used (when PTT is settled)
export async function decrementCreditUsed(userId: string, amount: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('decrement_credit_used', {
    user_id_param: userId,
    amount_param: amount
  });

  if (error) throw new Error(`Failed to decrement credit used: ${error.message}`);
}

// Get all importers with their credit information (for bank dashboard)
export async function getAllImportersCreditInfo() {
  const supabase = await createClient();

  const { data: importers, error } = await supabase
    .from('users')
    .select('id, name, email, organization, credit_limit, credit_used')
    .eq('role', 'importer')
    .order('name');

  if (error) throw new Error(`Failed to get importers: ${error.message}`);

  return importers.map(imp => ({
    ...imp,
    available_credit: (imp.credit_limit || 0) - (imp.credit_used || 0),
    utilization_percentage: imp.credit_limit > 0
      ? ((imp.credit_used || 0) / imp.credit_limit) * 100
      : 0
  }));
}

// Validate if PTT amount is within credit limit
export async function validateCreditLimit(importerId: string, requestedAmount: number): Promise<{
  valid: boolean;
  available_credit: number;
  message?: string;
}> {
  const availableCredit = await getAvailableCredit(importerId);

  if (requestedAmount > availableCredit) {
    return {
      valid: false,
      available_credit: availableCredit,
      message: `Insufficient credit. Requested: $${requestedAmount.toLocaleString()}, Available: $${availableCredit.toLocaleString()}`
    };
  }

  return {
    valid: true,
    available_credit: availableCredit
  };
}
