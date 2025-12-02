import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/connections/invitations/[id]/reject - Reject an invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('connection_invitations')
      .select('*')
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
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Invitation rejected'
    });
  } catch (error: any) {
    console.error('Error rejecting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject invitation' },
      { status: 500 }
    );
  }
}
