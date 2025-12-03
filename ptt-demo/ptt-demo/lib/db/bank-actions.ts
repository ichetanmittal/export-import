import { createClient } from '@/lib/supabase/server';
import {
  PendingBankAction,
  PendingBankActionWithDetails,
  BankActionType,
  BankActionStatus
} from '../types/database';

export async function createPendingAction(
  actionType: BankActionType,
  initiatedBy: string,
  actionData: any,
  pttId?: string
): Promise<PendingBankAction> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pending_actions')
    .insert({
      action_type: actionType,
      ptt_id: pttId || null,
      initiated_by: initiatedBy,
      status: 'pending',
      action_data: actionData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating pending action:', error);
    throw new Error(error.message);
  }

  return data as PendingBankAction;
}

export async function getPendingActionsByStatus(
  status: BankActionStatus,
  bankRole?: 'maker' | 'checker' | 'admin' | null
): Promise<PendingBankActionWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from('pending_actions')
    .select(`
      *,
      ptt:ptt_id(
        *,
        original_importer:original_importer_id(id, name, email, organization)
      ),
      initiated_by_user:initiated_by(id, name, email, organization, bank_role),
      approved_by_user:approved_by(id, name, email, organization, bank_role)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pending actions:', error);
    throw new Error(error.message);
  }

  return data as PendingBankActionWithDetails[];
}

export async function getPendingActionById(
  id: string
): Promise<PendingBankActionWithDetails> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pending_actions')
    .select(`
      *,
      ptt:ptt_id(
        *,
        original_importer:original_importer_id(id, name, email, organization)
      ),
      initiated_by_user:initiated_by(id, name, email, organization, bank_role),
      approved_by_user:approved_by(id, name, email, organization, bank_role)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching pending action:', error);
    throw new Error(error.message);
  }

  return data as PendingBankActionWithDetails;
}

export async function approvePendingAction(
  id: string,
  approvedBy: string
): Promise<PendingBankAction> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pending_actions')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error approving action:', error);
    throw new Error(error.message);
  }

  return data as PendingBankAction;
}

export async function rejectPendingAction(
  id: string,
  approvedBy: string,
  rejectionReason: string
): Promise<PendingBankAction> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pending_actions')
    .update({
      status: 'rejected',
      approved_by: approvedBy,
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting action:', error);
    throw new Error(error.message);
  }

  return data as PendingBankAction;
}

export async function getPendingActionsByInitiator(
  initiatedBy: string
): Promise<PendingBankActionWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pending_actions')
    .select(`
      *,
      ptt:ptt_id(
        *,
        original_importer:original_importer_id(id, name, email, organization)
      ),
      initiated_by_user:initiated_by(id, name, email, organization, bank_role),
      approved_by_user:approved_by(id, name, email, organization, bank_role)
    `)
    .eq('initiated_by', initiatedBy)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching actions by initiator:', error);
    throw new Error(error.message);
  }

  return data as PendingBankActionWithDetails[];
}
