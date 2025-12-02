import { NextRequest, NextResponse } from 'next/server';
import {
  createPendingAction,
  getPendingActionsByStatus,
  getPendingActionsByInitiator
} from '@/lib/db/bank-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const initiatedBy = searchParams.get('initiated_by');

    let actions;
    if (initiatedBy) {
      actions = await getPendingActionsByInitiator(initiatedBy);
    } else if (status) {
      actions = await getPendingActionsByStatus(status as any);
    } else {
      // Default to pending actions
      actions = await getPendingActionsByStatus('pending');
    }

    return NextResponse.json({ data: actions });
  } catch (error: any) {
    console.error('Error fetching pending actions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending actions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action_type, ptt_id, initiated_by, action_data } = body;

    if (!action_type || !initiated_by || !action_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pendingAction = await createPendingAction(
      action_type,
      initiated_by,
      action_data,
      ptt_id
    );

    return NextResponse.json({
      data: pendingAction,
      message: 'Pending action created successfully'
    });
  } catch (error: any) {
    console.error('Error creating pending action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create pending action' },
      { status: 500 }
    );
  }
}
