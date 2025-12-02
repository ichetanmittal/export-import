import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/connections/invite - Send an invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sender_id, receiver_email, receiver_role, message } = body;

    if (!sender_id || !receiver_email || !receiver_role) {
      return NextResponse.json(
        { error: 'sender_id, receiver_email, and receiver_role are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if receiver exists
    const { data: receiver, error: receiverError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', receiver_email)
      .single();

    if (receiverError && receiverError.code !== 'PGRST116') {
      throw receiverError;
    }

    // If receiver doesn't exist, create invitation without receiver_id
    const receiverId = receiver?.id || null;

    // Verify receiver role matches if user exists
    if (receiver && receiver.role !== receiver_role) {
      return NextResponse.json(
        { error: `User with email ${receiver_email} is not a ${receiver_role}` },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('connection_invitations')
      .select('id, status')
      .eq('sender_id', sender_id)
      .eq('receiver_email', receiver_email)
      .single();

    if (existingInvitation && existingInvitation.status === 'pending') {
      return NextResponse.json(
        { error: 'An invitation to this user is already pending' },
        { status: 400 }
      );
    }

    // Check if connection already exists (if receiver exists)
    if (receiverId) {
      const { data: existingConnection } = await supabase
        .from('user_connections')
        .select('id')
        .or(`and(importer_id.eq.${sender_id},exporter_id.eq.${receiverId}),and(importer_id.eq.${receiverId},exporter_id.eq.${sender_id})`)
        .single();

      if (existingConnection) {
        return NextResponse.json(
          { error: 'Connection already exists with this user' },
          { status: 400 }
        );
      }
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('connection_invitations')
      .insert({
        sender_id,
        receiver_id: receiverId,
        receiver_email,
        receiver_role,
        message,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: invitation,
      message: 'Invitation sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
