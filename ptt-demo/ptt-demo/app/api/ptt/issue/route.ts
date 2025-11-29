import { NextRequest, NextResponse } from 'next/server';
import { issuePTT } from '@/lib/db/ptt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ptt_id, bank_id, backing_type } = body;

    if (!ptt_id || !bank_id || !backing_type) {
      return NextResponse.json(
        { error: 'PTT ID, bank ID, and backing type are required' },
        { status: 400 }
      );
    }

    const ptt = await issuePTT({
      ptt_id,
      bank_id,
      backing_type,
    });

    return NextResponse.json({
      data: ptt,
      message: 'PTT issued successfully',
    });
  } catch (error) {
    console.error('PTT issuance error:', error);
    return NextResponse.json(
      { error: 'Failed to issue PTT' },
      { status: 500 }
    );
  }
}
