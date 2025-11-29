import { NextRequest, NextResponse } from 'next/server';
import { acceptDiscountOffer, processDiscountPayment } from '@/lib/db/discounting';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offer_id, funder_id } = body;

    if (!offer_id || !funder_id) {
      return NextResponse.json(
        { error: 'Offer ID and funder ID are required' },
        { status: 400 }
      );
    }

    // Accept the offer
    await acceptDiscountOffer({
      offer_id,
      funder_id,
    });

    // Process immediate payment (demo - in production would integrate with payment gateway)
    const paymentRef = `PAY-${Date.now()}`;
    const result = await processDiscountPayment({
      offer_id,
      payment_reference: paymentRef,
    });

    return NextResponse.json({
      data: result,
      message: 'Offer accepted and payment processed successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Accept offer error:', error);
    return NextResponse.json(
      { error: 'Failed to accept offer' },
      { status: 500 }
    );
  }
}
