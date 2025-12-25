import { NextRequest, NextResponse } from 'next/server';
import { setBankClientCreditLimit } from '@/lib/db/bank-clients';

// Update credit limit for a bank-client relationship
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

    const bankClient = await setBankClientCreditLimit(id, creditLimit);

    return NextResponse.json({
      data: bankClient,
      message: 'Credit limit updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating credit limit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update credit limit' },
      { status: 500 }
    );
  }
}
