import { NextRequest, NextResponse } from 'next/server';
import { triggerSettlement } from '@/lib/db/settlement';

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

    const settlement = await triggerSettlement({ ptt_id });

    return NextResponse.json({
      data: settlement,
      message: 'Settlement triggered successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Trigger settlement error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger settlement' },
      { status: 500 }
    );
  }
}
