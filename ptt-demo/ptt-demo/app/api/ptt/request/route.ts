import { NextRequest, NextResponse } from 'next/server';
import { requestPTT } from '@/lib/db/ptt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      importer_id,
      amount,
      currency,
      maturity_days,
      exporter_id,
      trade_description,
      incoterms,
    } = body;

    if (!importer_id || !amount || !maturity_days) {
      return NextResponse.json(
        { error: 'Importer ID, amount, and maturity days are required' },
        { status: 400 }
      );
    }

    const ptt = await requestPTT({
      importer_id,
      amount,
      currency,
      maturity_days,
      exporter_id,
      trade_description,
      incoterms,
    });

    return NextResponse.json({
      data: ptt,
      message: 'PTT request created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('PTT request error:', error);
    return NextResponse.json(
      { error: 'Failed to create PTT request' },
      { status: 500 }
    );
  }
}
