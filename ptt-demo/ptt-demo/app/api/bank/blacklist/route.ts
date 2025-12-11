import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all blacklisted organizations for a bank
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bank_id');
    const organization = searchParams.get('organization');

    if (!bankId && !organization) {
      return NextResponse.json(
        { error: 'bank_id or organization is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from('blacklisted_organizations')
      .select(`
        *,
        bank:bank_id(id, name, organization),
        blacklisted_org:blacklisted_org_id(id, name, organization, email, role),
        blacklisted_by_user:blacklisted_by(id, name, email)
      `)
      .eq('is_active', true)
      .order('blacklisted_at', { ascending: false });

    if (bankId) {
      query = query.eq('bank_id', bankId);
    } else if (organization) {
      // Get bank IDs for this organization
      const { data: bankUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'bank')
        .eq('organization', organization);

      if (bankUsers && bankUsers.length > 0) {
        const bankIds = bankUsers.map(b => b.id);
        query = query.in('bank_id', bankIds);
      }
    }

    const { data: blacklist, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: blacklist || [],
      count: blacklist?.length || 0,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch blacklist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blacklist' },
      { status: 500 }
    );
  }
}

// POST - Add organization to blacklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bank_id, blacklisted_org_id, reason, blacklisted_by, notes } = body;

    if (!bank_id || !blacklisted_org_id || !blacklisted_by) {
      return NextResponse.json(
        { error: 'bank_id, blacklisted_org_id, and blacklisted_by are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if already blacklisted
    const { data: existing } = await supabase
      .from('blacklisted_organizations')
      .select('id, is_active')
      .eq('bank_id', bank_id)
      .eq('blacklisted_org_id', blacklisted_org_id)
      .single();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: 'Organization is already blacklisted' },
          { status: 400 }
        );
      } else {
        // Reactivate existing blacklist entry
        const { data: updated, error } = await supabase
          .from('blacklisted_organizations')
          .update({
            is_active: true,
            reason: reason || null,
            notes: notes || null,
            blacklisted_by,
            blacklisted_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select(`
            *,
            blacklisted_org:blacklisted_org_id(id, name, organization, email, role)
          `)
          .single();

        if (error) throw error;

        return NextResponse.json({
          data: updated,
          message: 'Organization re-blacklisted successfully',
        }, { status: 200 });
      }
    }

    // Create new blacklist entry
    const { data: blacklist, error } = await supabase
      .from('blacklisted_organizations')
      .insert({
        bank_id,
        blacklisted_org_id,
        reason: reason || null,
        notes: notes || null,
        blacklisted_by,
      })
      .select(`
        *,
        blacklisted_org:blacklisted_org_id(id, name, organization, email, role)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: blacklist,
      message: 'Organization blacklisted successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to blacklist organization:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to blacklist organization' },
      { status: 500 }
    );
  }
}

// DELETE - Remove from blacklist (deactivate)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Blacklist entry ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('blacklisted_organizations')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data,
      message: 'Organization removed from blacklist',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to remove from blacklist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove from blacklist' },
      { status: 500 }
    );
  }
}
