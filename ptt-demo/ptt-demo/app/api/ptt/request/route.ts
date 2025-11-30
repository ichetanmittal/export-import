import { NextRequest, NextResponse } from 'next/server';
import { requestPTT } from '@/lib/db/ptt';
import { validateCreditLimit } from '@/lib/db/credit';

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

    // Validate credit limit before creating PTT request
    const creditCheck = await validateCreditLimit(importer_id, parseFloat(amount));

    if (!creditCheck.valid) {
      return NextResponse.json(
        {
          error: creditCheck.message,
          available_credit: creditCheck.available_credit,
          requested_amount: parseFloat(amount)
        },
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
      credit_info: {
        available_credit: creditCheck.available_credit,
        credit_remaining: creditCheck.available_credit - parseFloat(amount)
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('PTT request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create PTT request' },
      { status: 500 }
    );
  }
}
