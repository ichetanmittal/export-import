import { NextRequest, NextResponse } from 'next/server';
import { getCreditInfo, getAllImportersCreditInfo } from '@/lib/db/credit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const allImporters = searchParams.get('all_importers');

    if (allImporters === 'true') {
      // Get all importers' credit info (for bank dashboard)
      const importers = await getAllImportersCreditInfo();
      return NextResponse.json({ data: importers });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const creditInfo = await getCreditInfo(userId);

    return NextResponse.json({ data: creditInfo });
  } catch (error: any) {
    console.error('Get credit info error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get credit information' },
      { status: 500 }
    );
  }
}
