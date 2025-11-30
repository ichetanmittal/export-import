import { NextRequest, NextResponse } from 'next/server';
import { setCreditLimit } from '@/lib/db/credit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, credit_limit } = body;

    if (!user_id || credit_limit === undefined) {
      return NextResponse.json(
        { error: 'User ID and credit limit are required' },
        { status: 400 }
      );
    }

    if (credit_limit < 0) {
      return NextResponse.json(
        { error: 'Credit limit cannot be negative' },
        { status: 400 }
      );
    }

    await setCreditLimit(user_id, parseFloat(credit_limit));

    return NextResponse.json({
      message: 'Credit limit updated successfully',
      data: {
        user_id,
        new_limit: parseFloat(credit_limit)
      }
    });
  } catch (error: any) {
    console.error('Set credit limit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set credit limit' },
      { status: 500 }
    );
  }
}
