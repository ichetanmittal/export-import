import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getFinancingBanks,
  getIssuingBanks,
  createInterBankLimit,
} from '@/lib/db/inter-bank-limits';

// Get inter-bank limits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankOrgId = searchParams.get('bankOrgId');
    const type = searchParams.get('type'); // 'issuing' or 'financing'

    if (!bankOrgId) {
      return NextResponse.json(
        { error: 'Bank organization ID is required' },
        { status: 400 }
      );
    }

    let limits;
    if (type === 'financing') {
      // Get banks that provide financing to this issuing bank
      limits = await getFinancingBanks(bankOrgId);
    } else {
      // Get banks that this financing bank provides financing to
      limits = await getIssuingBanks(bankOrgId);
    }

    return NextResponse.json({ data: limits });
  } catch (error: any) {
    console.error('Error fetching inter-bank limits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inter-bank limits' },
      { status: 500 }
    );
  }
}

// Create inter-bank limit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issuingBankId, financingBankId, creditLimit } = body;

    if (!issuingBankId || !financingBankId || !creditLimit) {
      return NextResponse.json(
        { error: 'Issuing bank ID, financing bank ID, and credit limit are required' },
        { status: 400 }
      );
    }

    if (creditLimit < 0) {
      return NextResponse.json(
        { error: 'Credit limit must be positive' },
        { status: 400 }
      );
    }

    const interBankLimit = await createInterBankLimit({
      issuing_bank_id: issuingBankId,
      financing_bank_id: financingBankId,
      credit_limit: creditLimit,
    });

    return NextResponse.json({
      data: interBankLimit,
      message: 'Inter-bank limit created successfully',
    });
  } catch (error: any) {
    console.error('Error creating inter-bank limit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create inter-bank limit' },
      { status: 500 }
    );
  }
}
