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

    // Get all bank users from this organization and sum their balances
    const { data: bankUsers, error } = await supabase
      .from('users')
      .select('balance')
      .eq('organization', decodeURIComponent(organization))
      .eq('role', 'bank');

    if (error) {
      console.error('Error fetching bank users:', error);
      throw error;
    }

    // Calculate total treasury
    const totalTreasury = bankUsers.reduce((sum, user) => {
      return sum + (parseFloat(user.balance?.toString() || '0'));
    }, 0);

    return NextResponse.json({
      organization: decodeURIComponent(organization),
      totalTreasury,
      userCount: bankUsers.length
    });
  } catch (error: any) {
    console.error('Error fetching bank treasury:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bank treasury' },
      { status: 500 }
    );
  }
}
