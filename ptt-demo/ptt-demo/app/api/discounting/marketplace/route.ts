import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceOffers } from '@/lib/db/discounting';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const min_amount = searchParams.get('minAmount')
      ? parseFloat(searchParams.get('minAmount')!)
      : undefined;
    const max_maturity = searchParams.get('maxMaturity') || undefined;

    const offers = await getMarketplaceOffers({
      status,
      min_amount,
      max_maturity,
    });

    return NextResponse.json({
      data: offers,
      total: offers.length,
    });
  } catch (error) {
    console.error('Get marketplace offers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace offers' },
      { status: 500 }
    );
  }
}
