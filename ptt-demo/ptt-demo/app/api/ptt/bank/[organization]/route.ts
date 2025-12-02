import { NextRequest, NextResponse } from 'next/server';
import { getPTTsByBankOrganization } from '@/lib/db/ptt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organization: string }> }
) {
  try {
    const { organization } = await params;

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization is required' },
        { status: 400 }
      );
    }

    const ptts = await getPTTsByBankOrganization(decodeURIComponent(organization));

    return NextResponse.json({ data: ptts });
  } catch (error: any) {
    console.error('Error fetching bank PTTs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch PTTs' },
      { status: 500 }
    );
  }
}
