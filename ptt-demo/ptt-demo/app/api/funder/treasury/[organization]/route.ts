import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();

    // Get all funder users from this organization and sum their balances
    const { data: funderUsers, error } = await supabase
      .from('users')
      .select('balance')
      .eq('organization', decodeURIComponent(organization))
      .eq('role', 'funder');

    if (error) {
      console.error('Error fetching funder users:', error);
      throw error;
    }

    // Calculate total treasury
    const totalTreasury = funderUsers.reduce((sum, user) => {
      return sum + (parseFloat(user.balance?.toString() || '0'));
    }, 0);

    return NextResponse.json({
      organization: decodeURIComponent(organization),
      totalTreasury,
      userCount: funderUsers.length
    });
  } catch (error: any) {
    console.error('Error fetching funder treasury:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch funder treasury' },
      { status: 500 }
    );
  }
}
