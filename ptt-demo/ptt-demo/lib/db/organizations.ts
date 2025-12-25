import { createClient } from '@/lib/supabase/server';
import { Organization, OrganizationWithDetails, OrganizationType } from '@/lib/types/database';

// Get organization by ID
export async function getOrganizationById(org_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', org_id)
    .single();

  if (error) throw error;
  return data as Organization;
}

// Get organization by name
export async function getOrganizationByName(name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', name)
    .single();

  if (error) return null;
  return data as Organization;
}

// Get all organizations by type
export async function getOrganizationsByType(type: OrganizationType) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Organization[];
}

// Get organization with details (including users)
export async function getOrganizationWithDetails(org_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      users:users!organization_id(*)
    `)
    .eq('id', org_id)
    .single();

  if (error) throw error;
  return data as unknown as OrganizationWithDetails;
}

// Create organization
export async function createOrganization(data: {
  name: string;
  type: OrganizationType;
  email?: string;
  phone?: string;
  geography?: string;
  country?: string;
  treasury_balance?: number;
  credit_limit?: number;
  poc_name?: string;
  poc_email?: string;
  poc_phone?: string;
}) {
  const supabase = await createClient();

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: data.name,
      type: data.type,
      email: data.email || null,
      phone: data.phone || null,
      geography: data.geography || null,
      country: data.country || null,
      treasury_balance: data.treasury_balance || 0,
      credit_limit: data.credit_limit || 0,
      credit_used: 0,
      poc_name: data.poc_name || null,
      poc_email: data.poc_email || null,
      poc_phone: data.poc_phone || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return org as Organization;
}

// Update organization
export async function updateOrganization(
  org_id: string,
  updates: Partial<Organization>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', org_id)
    .select()
    .single();

  if (error) throw error;
  return data as Organization;
}

// Get organization treasury balance
export async function getOrganizationTreasury(org_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_org_treasury', {
    org_id_param: org_id,
  });

  if (error) throw error;
  return data as number;
}

// Increment organization treasury
export async function incrementOrganizationTreasury(
  org_id: string,
  amount: number
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_org_treasury', {
    org_id_param: org_id,
    amount_param: amount,
  });

  if (error) throw error;
}

// Decrement organization treasury
export async function decrementOrganizationTreasury(
  org_id: string,
  amount: number
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('decrement_org_treasury', {
    org_id_param: org_id,
    amount_param: amount,
  });

  if (error) throw error;
}

// Get organization available credit
export async function getOrganizationAvailableCredit(org_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_org_available_credit', {
    org_id_param: org_id,
  });

  if (error) throw error;
  return data as number;
}

// Set organization credit limit
export async function setOrganizationCreditLimit(
  org_id: string,
  new_limit: number
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('set_org_credit_limit', {
    org_id_param: org_id,
    new_limit: new_limit,
  });

  if (error) throw error;
}

// Increment organization credit used
export async function incrementOrganizationCreditUsed(
  org_id: string,
  amount: number
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_org_credit_used', {
    org_id_param: org_id,
    amount_param: amount,
  });

  if (error) throw error;
}

// Decrement organization credit used
export async function decrementOrganizationCreditUsed(
  org_id: string,
  amount: number
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('decrement_org_credit_used', {
    org_id_param: org_id,
    amount_param: amount,
  });

  if (error) throw error;
}
