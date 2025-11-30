import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsByPTTId } from '@/lib/db/documents';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ptt_id = searchParams.get('ptt_id');

    if (!ptt_id) {
      return NextResponse.json(
        { error: 'PTT ID is required' },
        { status: 400 }
      );
    }

    const documents = await getDocumentsByPTTId(ptt_id);

    return NextResponse.json({
      documents,
    });
  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
