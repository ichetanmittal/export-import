import { NextRequest, NextResponse } from 'next/server';
import { setInterBankCreditLimit, deactivateInterBankLimit } from '@/lib/db/inter-bank-limits';

// Update inter-bank limit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { creditLimit } = body;

    if (!creditLimit || creditLimit < 0) {
      return NextResponse.json(
        { error: 'Valid credit limit is required' },
        { status: 400 }
      );
    }

    const interBankLimit = await setInterBankCreditLimit(id, creditLimit);

    return NextResponse.json({
      data: interBankLimit,
      message: 'Inter-bank limit updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating inter-bank limit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update inter-bank limit' },
      { status: 500 }
    );
  }
}

// Deactivate inter-bank limit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const interBankLimit = await deactivateInterBankLimit(id);

    return NextResponse.json({
      data: interBankLimit,
      message: 'Inter-bank limit deactivated successfully',
    });
  } catch (error: any) {
    console.error('Error deactivating inter-bank limit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate inter-bank limit' },
      { status: 500 }
    );
  }
}
