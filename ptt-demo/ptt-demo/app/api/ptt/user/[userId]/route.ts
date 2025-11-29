import { NextRequest, NextResponse } from 'next/server';
import { getPTTsByUserId } from '@/lib/db/ptt';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    const ptts = await getPTTsByUserId(userId);

    return NextResponse.json({
      data: ptts,
      total: ptts.length,
    });
  } catch (error) {
    console.error('Get PTTs by user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PTTs' },
      { status: 500 }
    );
  }
}
