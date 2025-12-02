import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/connections/invitations/[id]/accept - Accept an invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('connection_invitations')
      .select('*, sender:sender_id(id, role)')
      .eq('id', id)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      );
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('connection_invitations')
      .update({
        status: 'accepted',
        receiver_id: user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Create connection
    const senderRole = invitation.sender.role;
    const receiverRole = invitation.receiver_role;

    let connectionData;
    if (senderRole === 'importer' && receiverRole === 'exporter') {
      connectionData = {
        importer_id: invitation.sender_id,
        exporter_id: user_id
      };
    } else if (senderRole === 'exporter' && receiverRole === 'importer') {
      connectionData = {
        importer_id: user_id,
        exporter_id: invitation.sender_id
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid role combination for connection' },
        { status: 400 }
      );
    }

    const { data: connection, error: connectionError } = await supabase
      .from('user_connections')
      .insert(connectionData)
      .select()
      .single();

    if (connectionError) throw connectionError;

    return NextResponse.json({
      data: connection,
      message: 'Invitation accepted and connection created'
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
