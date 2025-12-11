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
      exporter_bank_id,
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

    // Check if exporter is blacklisted by the importer's bank
    if (exporter_id && exporter_bank_id) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      // Get importer's bank
      const { data: importerData } = await supabase
        .from('users')
        .select('my_bank_id')
        .eq('id', importer_id)
        .single();

      if (importerData?.my_bank_id) {
        // Check if exporter is blacklisted by importer's bank
        const { data: blacklisted } = await supabase
          .from('blacklisted_organizations')
          .select('id, reason')
          .eq('bank_id', importerData.my_bank_id)
          .eq('blacklisted_org_id', exporter_id)
          .eq('is_active', true)
          .single();

        if (blacklisted) {
          return NextResponse.json(
            {
              error: 'Exporter is blacklisted',
              reason: blacklisted.reason,
              message: 'This exporter has been blacklisted by your bank and cannot be used for PTT requests.'
            },
            { status: 403 }
          );
        }
      }
    }

    const ptt = await requestPTT({
      importer_id,
      amount,
      currency,
      maturity_days,
      exporter_id,
      exporter_bank_id,
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
