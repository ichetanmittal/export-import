import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// FIXED: Now uses organization-level treasury instead of summing user balances
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
    const orgName = decodeURIComponent(organization);

    // FIXED: Get organization treasury directly from organizations table
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, treasury_balance, type')
      .eq('name', orgName)
      .eq('type', 'bank')
      .single();

    if (orgError || !org) {
      // Fallback to legacy method for backward compatibility
      const { data: bankUsers, error } = await supabase
        .from('users')
        .select('balance, organization_id')
        .eq('organization', orgName)
        .eq('role', 'bank');

      if (error) {
        console.error('Error fetching bank data:', error);
        throw error;
      }

      // Legacy: Sum user balances
      const totalTreasury = bankUsers.reduce((sum, user) => {
        return sum + (parseFloat(user.balance?.toString() || '0'));
      }, 0);

      return NextResponse.json({
        organization: orgName,
        totalTreasury,
        userCount: bankUsers.length,
        legacy: true, // Indicator that this is using old method
      });
    }

    // NEW: Get user count for the organization
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);

    return NextResponse.json({
      organization: org.name,
      organizationId: org.id,
      totalTreasury: org.treasury_balance,
      userCount: userCount || 0,
      legacy: false, // Using new organization-level treasury
    });
  } catch (error: any) {
    console.error('Error fetching bank treasury:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bank treasury' },
      { status: 500 }
    );
  }
}
