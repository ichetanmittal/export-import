import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all documents for PTTs issued by a bank
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organization = searchParams.get('organization');
    const approvalStatus = searchParams.get('approval_status');

    if (!organization) {
      return NextResponse.json(
        { error: 'organization is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all bank users for this organization
    const { data: bankUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'bank')
      .eq('organization', organization);

    if (!bankUsers || bankUsers.length === 0) {
      return NextResponse.json({
        data: [],
        count: 0,
      }, { status: 200 });
    }

    const bankIds = bankUsers.map(b => b.id);

    // Get all documents for PTTs issued by this bank
    let query = supabase
      .from('documents')
      .select(`
        *,
        ptt:ptt_id(
          id,
          ptt_number,
          amount,
          currency,
          status,
          maturity_date,
          issuer_bank_id,
          original_importer:original_importer_id(id, name, organization, email),
          exporter:exporter_id(id, name, organization, email)
        ),
        uploaded_by:uploaded_by_id(id, name, organization),
        approved_by:approved_by_id(id, name, organization)
      `)
      .in('ptt.issuer_bank_id', bankIds)
      .order('created_at', { ascending: false });

    // Filter by approval status if provided
    if (approvalStatus) {
      query = query.eq('approval_status', approvalStatus);
    }

    const { data: documents, error } = await query;

    if (error) throw error;

    // Filter out documents where ptt is null (should not happen but defensive)
    const validDocuments = documents?.filter(doc => doc.ptt !== null) || [];

    return NextResponse.json({
      data: validDocuments,
      count: validDocuments.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch bank documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
