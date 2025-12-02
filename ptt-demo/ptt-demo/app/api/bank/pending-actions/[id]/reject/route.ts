import { NextRequest, NextResponse } from 'next/server';
import { rejectPendingAction } from '@/lib/db/bank-actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approved_by, rejection_reason } = body;

    if (!approved_by || !rejection_reason) {
      return NextResponse.json(
        { error: 'approved_by and rejection_reason are required' },
        { status: 400 }
      );
    }

    const rejectedAction = await rejectPendingAction(id, approved_by, rejection_reason);

    return NextResponse.json({
      data: rejectedAction,
      message: 'Action rejected successfully'
    });
  } catch (error: any) {
    console.error('Error rejecting action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject action' },
      { status: 500 }
    );
  }
}
