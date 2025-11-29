import { NextRequest, NextResponse } from 'next/server';
import { updateDocumentApproval } from '@/lib/db/documents';
import { markPTTAsRedeemable } from '@/lib/db/ptt';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ptt_id, document_ids, approved, approved_by_id, rejection_reason } = body;

    // Handle simple PTT approval (for demo - marks redeemable without actual documents)
    if (ptt_id && !document_ids) {
      const supabase = await createClient();

      // Update all action conditions to met
      await supabase
        .from('ptt_conditions')
        .update({ is_met: true, met_at: new Date().toISOString() })
        .eq('ptt_id', ptt_id)
        .eq('condition_type', 'action');

      // Mark PTT as redeemable
      await markPTTAsRedeemable(ptt_id);

      return NextResponse.json({
        message: 'PTT marked as redeemable successfully',
      });
    }

    // Handle document approval
    if (!document_ids || !Array.isArray(document_ids) || !approved_by_id) {
      return NextResponse.json(
        { error: 'Document IDs array and approver ID are required' },
        { status: 400 }
      );
    }

    const documents = await updateDocumentApproval({
      document_ids,
      approved: approved !== false,
      approved_by_id,
      rejection_reason,
    });

    // If approved, also mark PTT as redeemable
    if (approved !== false && documents.length > 0) {
      const firstDoc = documents[0];
      await markPTTAsRedeemable(firstDoc.ptt_id);
    }

    return NextResponse.json({
      data: documents,
      message: `Documents ${approved !== false ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Document approval error:', error);
    return NextResponse.json(
      { error: 'Failed to update document approval' },
      { status: 500 }
    );
  }
}
