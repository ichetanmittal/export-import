import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientsForBank } from '@/lib/db/bank-clients';

// Get all clients for a bank
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankOrgId = searchParams.get('bankOrgId');
    const relationshipType = searchParams.get('relationshipType') as 'issuing' | 'financing' | 'both' | null;

    if (!bankOrgId) {
      return NextResponse.json(
        { error: 'Bank organization ID is required' },
        { status: 400 }
      );
    }

    const clients = await getClientsForBank(bankOrgId, relationshipType || undefined);

    return NextResponse.json({ data: clients });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
