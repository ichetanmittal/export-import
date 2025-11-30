import { NextRequest, NextResponse } from 'next/server';
import { settlePayment } from '@/lib/db/settlement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ptt_id } = body;

    if (!ptt_id) {
      return NextResponse.json(
        { error: 'PTT ID is required' },
        { status: 400 }
      );
    }

    // One-click settlement - handles everything
    const settlement = await settlePayment(ptt_id);

    return NextResponse.json({
      data: settlement,
      message: 'Settlement completed successfully! Money transferred from bank treasury to beneficiary.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Settlement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process settlement' },
      { status: 500 }
    );
  }
}
