import { NextRequest, NextResponse } from 'next/server';
import { processSettlementPayment } from '@/lib/db/settlement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlement_id, payment_reference } = body;

    if (!settlement_id || !payment_reference) {
      return NextResponse.json(
        { error: 'Settlement ID and payment reference are required' },
        { status: 400 }
      );
    }

    const settlement = await processSettlementPayment({
      settlement_id,
      payment_reference,
    });

    return NextResponse.json({
      data: settlement,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Process payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
