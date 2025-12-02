import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch all users with role='exporter'
    const { data: exporters, error } = await supabase
      .from('users')
      .select('id, name, email, organization')
      .eq('role', 'exporter')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching exporters:', error);
      return NextResponse.json(
        { error: 'Failed to fetch exporters' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: exporters });
  } catch (error) {
    console.error('Error in GET /api/users/exporters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
