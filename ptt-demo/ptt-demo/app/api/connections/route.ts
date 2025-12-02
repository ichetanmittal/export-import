import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/connections - Get list of connections for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'user_id and role are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (role === 'importer') {
      // Get all exporters connected to this importer
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          created_at,
          exporter:exporter_id (
            id,
            name,
            email,
            organization
          )
        `)
        .eq('importer_id', userId);

      if (error) throw error;

      return NextResponse.json({
        data: connections?.map(c => ({
          id: c.id,
          user: c.exporter,
          created_at: c.created_at
        })) || []
      });
    } else if (role === 'exporter') {
      // Get all importers connected to this exporter
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          created_at,
          importer:importer_id (
            id,
            name,
            email,
            organization
          )
        `)
        .eq('exporter_id', userId);

      if (error) throw error;

      return NextResponse.json({
        data: connections?.map(c => ({
          id: c.id,
          user: c.importer,
          created_at: c.created_at
        })) || []
      });
    }

    return NextResponse.json({ data: [] });
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
