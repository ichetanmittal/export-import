import { NextRequest, NextResponse } from 'next/server';
import { updateDocumentApproval } from '@/lib/db/documents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_ids, approved, approved_by_id, rejection_reason } = body;

    if (!document_ids || !Array.isArray(document_ids) || !approved_by_id) {
      return NextResponse.json(
        { error: 'Document IDs array and approver ID are required' },
        { status: 400 }
      );
    }

    const documents = await updateDocumentApproval({
      document_ids,
      approved: approved !== false, // Default to true if not specified
      approved_by_id,
      rejection_reason,
    });

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
