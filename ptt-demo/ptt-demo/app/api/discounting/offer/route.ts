import { NextRequest, NextResponse } from 'next/server';
import { createDiscountOffer } from '@/lib/db/discounting';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ptt_id, exporter_id, asking_price, discount_rate } = body;

    if (!ptt_id || !exporter_id || !asking_price || discount_rate === undefined) {
      return NextResponse.json(
        { error: 'PTT ID, exporter ID, asking price, and discount rate are required' },
        { status: 400 }
      );
    }

    const offer = await createDiscountOffer({
      ptt_id,
      exporter_id,
      asking_price,
      discount_rate,
    });

    return NextResponse.json({
      data: offer,
      message: 'Discount offer created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create discount offer error:', error);
    return NextResponse.json(
      { error: 'Failed to create discount offer' },
      { status: 500 }
    );
  }
}
