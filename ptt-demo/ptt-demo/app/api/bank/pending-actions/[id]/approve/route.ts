import { NextRequest, NextResponse } from 'next/server';
import { approvePendingAction, getPendingActionById } from '@/lib/db/bank-actions';
import { issuePTT } from '@/lib/db/ptt';
import { settlePayment } from '@/lib/db/settlement';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approved_by } = body;

    if (!approved_by) {
      return NextResponse.json(
        { error: 'approved_by is required' },
        { status: 400 }
      );
    }

    // Get the pending action details
    const action = await getPendingActionById(id);

    if (action.status !== 'pending') {
      return NextResponse.json(
        { error: 'Action has already been processed' },
        { status: 400 }
      );
    }

    // Approve the action
    const approvedAction = await approvePendingAction(id, approved_by);

    // Execute the actual action based on action_type
    if (action.action_type === 'issue_ptt') {
      const { ptt_id, bank_id, backing_type } = action.action_data;

      // Issue the PTT
      await issuePTT({
        ptt_id,
        bank_id,
        backing_type
      });
    } else if (action.action_type === 'settle_ptt') {
      const { ptt_id } = action.action_data;

      // Execute settlement
      await settlePayment(ptt_id);
    } else if (action.action_type === 'accept_offer') {
      const { offer_id, funder_id } = action.action_data;

      // Accept the offer
      const acceptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/discounting/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id,
          funder_id,
        })
      });

      if (!acceptResponse.ok) {
        throw new Error('Failed to accept offer');
      }
    }

    return NextResponse.json({
      data: approvedAction,
      message: 'Action approved and executed successfully'
    });
  } catch (error: any) {
    console.error('Error approving action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve action' },
      { status: 500 }
    );
  }
}
