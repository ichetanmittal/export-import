import { NextRequest, NextResponse } from 'next/server';
import { lockPTT } from '@/lib/db/ptt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ptt_id, conditions } = body;

    if (!ptt_id || !conditions || !Array.isArray(conditions)) {
      return NextResponse.json(
        { error: 'PTT ID and conditions array are required' },
        { status: 400 }
      );
    }

    const result = await lockPTT({
      ptt_id,
      conditions,
    });

    return NextResponse.json({
      data: result,
      message: 'PTT locked with conditions and transferred to exporter',
    }, { status: 200 });
  } catch (error) {
    console.error('Lock PTT error:', error);
    return NextResponse.json(
      { error: 'Failed to lock PTT' },
      { status: 500 }
    );
  }
}
