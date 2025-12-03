import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all PTTs with status 'requested'
    const { data: requests, error } = await supabase
      .from('ptt_tokens')
      .select(`
        *,
        original_importer:original_importer_id(id, name, organization, email)
      `)
      .eq('status', 'requested')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get all pending actions for issue_ptt
    const { data: pendingActions, error: pendingError } = await supabase
      .from('pending_actions')
      .select('ptt_id')
      .eq('action_type', 'issue_ptt')
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    // Filter out PTTs that have pending actions
    const pendingPttIds = new Set(pendingActions?.map(action => action.ptt_id) || []);
    const filteredRequests = requests?.filter(request => !pendingPttIds.has(request.id)) || [];

    return NextResponse.json({
      data: filteredRequests,
      count: filteredRequests?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch PTT requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PTT requests' },
      { status: 500 }
    );
  }
}
