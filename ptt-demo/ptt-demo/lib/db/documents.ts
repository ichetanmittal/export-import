import { createClient } from '@/lib/supabase/server';
import { Document, DocumentType, ApprovalStatus } from '@/lib/types/database';

// Upload document
export async function uploadDocument(data: {
  ptt_id: string;
  uploaded_by_id: string;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  file_size_kb?: number;
}) {
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from('documents')
    .insert({
      ptt_id: data.ptt_id,
      uploaded_by_id: data.uploaded_by_id,
      document_type: data.document_type,
      file_path: data.file_path,
      file_name: data.file_name,
      file_size_kb: data.file_size_kb || null,
      approval_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return document as Document;
}

// Get documents for a PTT
export async function getDocumentsByPTTId(ptt_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploaded_by:uploaded_by_id(id, name, organization),
      approved_by:approved_by_id(id, name, organization)
    `)
    .eq('ptt_id', ptt_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Approve/Reject documents
export async function updateDocumentApproval(data: {
  document_ids: string[];
  approved: boolean;
  approved_by_id: string;
  rejection_reason?: string;
}) {
  const supabase = await createClient();

  const updateData: any = {
    approval_status: data.approved ? 'approved' : 'rejected',
    approved_by_id: data.approved_by_id,
    approved_at: new Date().toISOString(),
  };

  if (!data.approved && data.rejection_reason) {
    updateData.rejection_reason = data.rejection_reason;
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .update(updateData)
    .in('id', data.document_ids)
    .select();

  if (error) throw error;

  // If all approved, check if we should mark PTT as redeemable
  if (data.approved && documents && documents.length > 0) {
    const ptt_id = documents[0].ptt_id;
    await checkAndMarkRedeemable(ptt_id);
  }

  return documents as Document[];
}

// Check if all required documents are approved and mark PTT as redeemable
async function checkAndMarkRedeemable(ptt_id: string) {
  const supabase = await createClient();

  // Get all documents for this PTT
  const { data: documents } = await supabase
    .from('documents')
    .select('approval_status')
    .eq('ptt_id', ptt_id);

  // Check if all documents are approved
  const allApproved = documents?.every((doc) => doc.approval_status === 'approved');

  if (allApproved && documents && documents.length > 0) {
    // Check PTT conditions
    const { data: conditions } = await supabase
      .from('ptt_conditions')
      .select('is_met')
      .eq('ptt_id', ptt_id);

    const allConditionsMet = conditions?.every((c) => c.is_met) || false;

    // If all conditions met, mark as redeemable
    if (allConditionsMet || !conditions || conditions.length === 0) {
      await supabase
        .from('ptt_tokens')
        .update({ status: 'redeemable' })
        .eq('id', ptt_id);

      // Mark document approval condition as met
      await supabase
        .from('ptt_conditions')
        .update({ is_met: true, met_at: new Date().toISOString() })
        .eq('ptt_id', ptt_id)
        .eq('condition_type', 'action')
        .eq('condition_key', 'document_approval');
    }
  }
}

// Delete document
export async function deleteDocument(document_id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', document_id);

  if (error) throw error;
  return { success: true };
}
