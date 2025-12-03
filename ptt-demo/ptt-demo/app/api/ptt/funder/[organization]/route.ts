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

    // Get all funder users from this organization
    const { data: funderUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('organization', decodeURIComponent(organization))
      .eq('role', 'funder');

    if (usersError) throw usersError;

    const funderUserIds = funderUsers.map(u => u.id);

    // Get all PTTs owned by any user from this funder organization
    const { data: ptts, error } = await supabase
      .from('ptt_tokens')
      .select(`
        *,
        issuer_bank:issuer_bank_id(id, name, organization),
        current_owner:current_owner_id(id, name, organization),
        original_importer:original_importer_id(id, name, organization),
        exporter:exporter_id(id, name, organization),
        discounting_offers(
          id,
          asking_price,
          discount_rate,
          status,
          accepted_at,
          exporter:exporter_id(id, name, organization)
        )
      `)
      .in('current_owner_id', funderUserIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      data: ptts || [],
      organization: decodeURIComponent(organization)
    });
  } catch (error: any) {
    console.error('Error fetching funder organization PTTs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch PTTs' },
      { status: 500 }
    );
  }
}
