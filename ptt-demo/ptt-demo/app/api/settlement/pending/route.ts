import { NextRequest, NextResponse } from 'next/server';
import { getPendingSettlements } from '@/lib/db/settlement';

export async function GET(request: NextRequest) {
  try {
    // In a real app, get bank_id from authenticated user
    // For now, we'll get all pending settlements regardless of bank
    // You can modify this to filter by bank_id from the auth token

    const user = request.headers.get('Authorization');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For demo purposes, we'll fetch settlements for all banks
    // In production, parse JWT to get bank_id and filter
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: settlements, error } = await supabase
      .from('settlements')
      .select(`
        *,
        ptt:ptt_id(id, ptt_number, amount, currency, maturity_date),
        beneficiary:beneficiary_id(id, name, organization)
      `)
      .in('status', ['triggered', 'paid'])
      .order('triggered_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      data: settlements,
    });
  } catch (error) {
    console.error('Get pending settlements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending settlements' },
      { status: 500 }
    );
  }
}
