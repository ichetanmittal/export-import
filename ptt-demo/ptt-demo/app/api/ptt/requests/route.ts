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

    return NextResponse.json({
      data: requests,
      count: requests?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch PTT requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PTT requests' },
      { status: 500 }
    );
  }
}
