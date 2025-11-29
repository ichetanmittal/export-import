import { NextRequest, NextResponse } from 'next/server';
import { getPTTById } from '@/lib/db/ptt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ptt = await getPTTById(id);

    if (!ptt) {
      return NextResponse.json(
        { error: 'PTT not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: ptt,
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch PTT:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PTT details' },
      { status: 500 }
    );
  }
}
