import { NextRequest, NextResponse } from 'next/server';
import { transferPTT } from '@/lib/db/ptt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ptt_id, from_user_id, to_user_id, transfer_type } = body;

    if (!ptt_id || !from_user_id || !to_user_id || !transfer_type) {
      return NextResponse.json(
        { error: 'PTT ID, from_user_id, to_user_id, and transfer_type are required' },
        { status: 400 }
      );
    }

    const result = await transferPTT({
      ptt_id,
      from_user_id,
      to_user_id,
      transfer_type,
    });

    return NextResponse.json({
      data: result,
      message: 'PTT transferred successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Transfer PTT error:', error);
    return NextResponse.json(
      { error: 'Failed to transfer PTT' },
      { status: 500 }
    );
  }
}
