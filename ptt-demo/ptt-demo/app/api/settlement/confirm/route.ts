import { NextRequest, NextResponse } from 'next/server';
import { confirmSettlement } from '@/lib/db/settlement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlement_id } = body;

    if (!settlement_id) {
      return NextResponse.json(
        { error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    const settlement = await confirmSettlement({ settlement_id });

    return NextResponse.json({
      data: settlement,
      message: 'Settlement confirmed and completed successfully',
    });
  } catch (error) {
    console.error('Confirm settlement error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm settlement' },
      { status: 500 }
    );
  }
}
