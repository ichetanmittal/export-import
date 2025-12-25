import { createClient } from '@/lib/supabase/server';
import { PTTToken, PTTStatus, PTTCondition, PTTWithDetails } from '@/lib/types/database';
import { incrementCreditUsed } from './credit';

// Request PTT
export async function requestPTT(data: {
  importer_id: string;
  amount: number;
  currency?: string;
  maturity_days: number;
  exporter_id?: string;
  exporter_bank_id?: string;
  trade_description?: string;
  incoterms?: string;
}) {
  const supabase = await createClient();

  // Calculate maturity date
  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + data.maturity_days);

  // Generate PTT number
  const pttNumber = `PTT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

  const { data: ptt, error } = await supabase
    .from('ptt_tokens')
    .insert({
      ptt_number: pttNumber,
      issuer_bank_id: data.importer_id, // Will be updated when bank issues
      current_owner_id: data.importer_id,
      original_importer_id: data.importer_id,
      exporter_id: data.exporter_id || null,
      exporter_bank_id: data.exporter_bank_id || null,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: 'requested',
      maturity_date: maturityDate.toISOString().split('T')[0],
      backing_type: 'treasury', // Default
      trade_description: data.trade_description || null,
      incoterms: data.incoterms || null,
    })
    .select()
    .single();

  if (error) throw error;
  return ptt as PTTToken;
}

// Issue PTT (Bank action)
// UPDATED: Now uses organization-level credit tracking
export async function issuePTT(data: {
  ptt_id: string;
  bank_id: string;
  backing_type: 'treasury' | 'od_limit' | 'credit';
}) {
  const supabase = await createClient();

  // Get PTT details with organization info
  const { data: existingPtt } = await supabase
    .from('ptt_tokens')
    .select(`
      *,
      original_importer:original_importer_id(id, organization_id),
      original_importer_org_id
    `)
    .eq('id', data.ptt_id)
    .single();

  // Get bank user's organization
  const { data: bankUser } = await supabase
    .from('users')
    .select('id, organization_id')
    .eq('id', data.bank_id)
    .single();

  const { data: ptt, error } = await supabase
    .from('ptt_tokens')
    .update({
      issuer_bank_id: data.bank_id,
      issuer_bank_org_id: bankUser?.organization_id, // NEW: Set bank organization
      backing_type: data.backing_type,
      status: 'issued',
    })
    .eq('id', data.ptt_id)
    .select()
    .single();

  if (error) throw error;

  // UPDATED: Increment credit at organization level
  const importerOrgId = existingPtt?.original_importer_org_id ||
                        (existingPtt?.original_importer as any)?.organization_id;

  if (importerOrgId) {
    // Use organization-level credit tracking
    const { incrementOrganizationCreditUsed } = await import('./organizations');
    await incrementOrganizationCreditUsed(importerOrgId, (ptt as PTTToken).amount);
  } else if (existingPtt?.original_importer_id) {
    // Fallback for legacy data
    await incrementCreditUsed(existingPtt.original_importer_id, (ptt as PTTToken).amount);
  }

  // Update bank_client credit used if relationship exists
  if (bankUser?.organization_id && importerOrgId) {
    const { data: bankClient } = await supabase
      .from('bank_clients')
      .select('id')
      .eq('bank_org_id', bankUser.organization_id)
      .eq('client_org_id', importerOrgId)
      .single();

    if (bankClient) {
      // Update PTT with bank_client reference
      await supabase
        .from('ptt_tokens')
        .update({ bank_client_id: bankClient.id })
        .eq('id', data.ptt_id);

      // Increment bank-client credit used
      const { incrementBankClientCredit } = await import('./bank-clients');
      await incrementBankClientCredit(bankClient.id, (ptt as PTTToken).amount);
    }
  }

  // Record transfer
  await supabase.from('ptt_transfers').insert({
    ptt_id: data.ptt_id,
    from_user_id: null,
    to_user_id: data.bank_id,
    transfer_type: 'issuance',
    amount: (ptt as PTTToken).amount,
  });

  return ptt as PTTToken;
}

// Lock PTT with conditions and auto-transfer to exporter
export async function lockPTT(data: {
  ptt_id: string;
  exporter_id: string;
  conditions: Array<{
    condition_type: 'time' | 'action' | 'data';
    condition_key: string;
    condition_value: string;
  }>;
}) {
  const supabase = await createClient();

  // Get PTT details first
  const { data: pttDetails, error: fetchError } = await supabase
    .from('ptt_tokens')
    .select('current_owner_id, amount')
    .eq('id', data.ptt_id)
    .single();

  if (fetchError) throw fetchError;

  const exporterId = data.exporter_id;

  if (!exporterId) {
    throw new Error('Exporter ID is required.');
  }

  // Update PTT with exporter and transfer ownership
  const { data: updatedPtt, error: pttError } = await supabase
    .from('ptt_tokens')
    .update({
      exporter_id: exporterId,
      status: 'transferred',
      current_owner_id: exporterId
    })
    .eq('id', data.ptt_id)
    .select()
    .single();

  if (pttError) throw pttError;

  // Insert conditions
  const { data: conditions, error: condError } = await supabase
    .from('ptt_conditions')
    .insert(
      data.conditions.map((cond) => ({
        ptt_id: data.ptt_id,
        ...cond,
      }))
    )
    .select();

  if (condError) throw condError;

  // Record the transfer to exporter
  await supabase.from('ptt_transfers').insert({
    ptt_id: data.ptt_id,
    from_user_id: pttDetails.current_owner_id,
    to_user_id: exporterId,
    transfer_type: 'conditional_payment',
    amount: pttDetails.amount,
  });

  return { conditions: conditions as PTTCondition[], ptt: updatedPtt as PTTToken };
}

// Transfer PTT
export async function transferPTT(data: {
  ptt_id: string;
  from_user_id: string;
  to_user_id: string;
  transfer_type: 'conditional_payment' | 'discounting' | 'settlement';
}) {
  const supabase = await createClient();

  // Update current owner
  const { data: ptt, error: pttError } = await supabase
    .from('ptt_tokens')
    .update({
      current_owner_id: data.to_user_id,
      status: 'transferred',
    })
    .eq('id', data.ptt_id)
    .select()
    .single();

  if (pttError) throw pttError;

  // Record transfer
  const { data: transfer, error: transferError } = await supabase
    .from('ptt_transfers')
    .insert({
      ptt_id: data.ptt_id,
      from_user_id: data.from_user_id,
      to_user_id: data.to_user_id,
      transfer_type: data.transfer_type,
      amount: (ptt as PTTToken).amount,
    })
    .select()
    .single();

  if (transferError) throw transferError;

  return { ptt: ptt as PTTToken, transfer };
}

// Get PTT by ID with details
export async function getPTTById(ptt_id: string) {
  const supabase = await createClient();

  const { data: ptt, error } = await supabase
    .from('ptt_tokens')
    .select(`
      *,
      issuer_bank:issuer_bank_id(id, name, organization, role),
      current_owner:current_owner_id(id, name, organization, role),
      original_importer:original_importer_id(id, name, organization, role),
      exporter:exporter_id(id, name, organization, role),
      exporter_bank:exporter_bank_id(id, name, organization, role),
      conditions:ptt_conditions(*),
      documents:documents(*),
      transfers:ptt_transfers(*)
    `)
    .eq('id', ptt_id)
    .single();

  if (error) throw error;
  return ptt as unknown as PTTWithDetails;
}

// Get all PTTs for a user
export async function getPTTsByUserId(user_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ptt_tokens')
    .select(`
      *,
      issuer_bank:issuer_bank_id(id, name, organization),
      current_owner:current_owner_id(id, name, organization),
      original_importer:original_importer_id(id, name, organization),
      exporter:exporter_id(id, name, organization),
      documents:documents(*),
      discounting_offers(
        id,
        asking_price,
        discount_rate,
        status,
        accepted_at,
        exporter:exporter_id(id, name, organization)
      )
    `)
    .or(`current_owner_id.eq.${user_id},original_importer_id.eq.${user_id},issuer_bank_id.eq.${user_id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get PTTs by bank organization (for bank users to see all PTTs from their bank)
export async function getPTTsByBankOrganization(organization: string) {
  const supabase = await createClient();

  // First get all users from this bank organization
  const { data: bankUsers, error: usersError } = await supabase
    .from('users')
    .select('id')
    .eq('organization', organization)
    .eq('role', 'bank');

  if (usersError) throw usersError;

  const bankUserIds = bankUsers.map(u => u.id);

  if (bankUserIds.length === 0) {
    return [];
  }

  // Get all PTTs issued by any user from this bank
  const { data, error } = await supabase
    .from('ptt_tokens')
    .select(`
      *,
      issuer_bank:issuer_bank_id(id, name, organization),
      current_owner:current_owner_id(id, name, organization),
      original_importer:original_importer_id(id, name, organization),
      exporter:exporter_id(id, name, organization),
      documents:documents(*),
      discounting_offers(
        id,
        asking_price,
        discount_rate,
        status,
        accepted_at,
        exporter:exporter_id(id, name, organization)
      )
    `)
    .in('issuer_bank_id', bankUserIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Mark PTT as redeemable
export async function markPTTAsRedeemable(ptt_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ptt_tokens')
    .update({ status: 'redeemable' })
    .eq('id', ptt_id)
    .select()
    .single();

  if (error) throw error;
  return data as PTTToken;
}

// Check if all conditions are met
export async function checkPTTConditions(ptt_id: string) {
  const supabase = await createClient();

  const { data: conditions, error } = await supabase
    .from('ptt_conditions')
    .select('*')
    .eq('ptt_id', ptt_id);

  if (error) throw error;

  const allMet = conditions?.every((c) => c.is_met) || false;

  return {
    all_met: allMet,
    conditions: conditions as PTTCondition[],
  };
}
