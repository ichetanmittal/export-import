import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/users/by-role - Get all users by role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!role) {
      return NextResponse.json(
        { error: 'role parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, organization, role')
      .eq('role', role)
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: users || [] });
  } catch (error: any) {
    console.error('Error fetching users by role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
