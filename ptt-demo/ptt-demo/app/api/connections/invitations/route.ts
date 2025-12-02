import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/connections/invitations - Get pending invitations (sent and received)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const userEmail = searchParams.get('user_email');
    const type = searchParams.get('type'); // 'sent' or 'received'

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'user_id and user_email are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (type === 'sent') {
      // Get invitations sent by this user
      const { data: invitations, error } = await supabase
        .from('connection_invitations')
        .select('*')
        .eq('sender_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ data: invitations || [] });
    } else if (type === 'received') {
      // Get invitations received by this user
      const { data: invitations, error } = await supabase
        .from('connection_invitations')
        .select(`
          *,
          sender:sender_id (
            id,
            name,
            email,
            organization,
            role
          )
        `)
        .eq('receiver_email', userEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ data: invitations || [] });
    } else {
      // Get all invitations (both sent and received)
      const { data: sentInvitations, error: sentError } = await supabase
        .from('connection_invitations')
        .select('*')
        .eq('sender_id', userId)
        .eq('status', 'pending');

      const { data: receivedInvitations, error: receivedError } = await supabase
        .from('connection_invitations')
        .select(`
          *,
          sender:sender_id (
            id,
            name,
            email,
            organization,
            role
          )
        `)
        .eq('receiver_email', userEmail)
        .eq('status', 'pending');

      if (sentError) throw sentError;
      if (receivedError) throw receivedError;

      return NextResponse.json({
        sent: sentInvitations || [],
        received: receivedInvitations || []
      });
    }
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
