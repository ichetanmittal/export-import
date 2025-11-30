import { NextRequest, NextResponse } from 'next/server';
import { createDiscountOffer } from '@/lib/db/discounting';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ptt_id, exporter_id, asking_price, discount_rate } = body;

    if (!ptt_id || !exporter_id || !asking_price || discount_rate === undefined) {
      return NextResponse.json(
        { error: 'PTT ID, exporter ID, asking price, and discount rate are required' },
        { status: 400 }
      );
    }

    // Check if an offer already exists for this PTT
    const supabase = await createClient();
    const { data: existingOffer } = await supabase
      .from('discounting_offers')
      .select('*')
      .eq('ptt_id', ptt_id)
      .eq('status', 'available')
      .single();

    if (existingOffer) {
      return NextResponse.json(
        { error: 'An offer already exists for this PTT. Please update the existing offer instead.' },
        { status: 409 }
      );
    }

    const offer = await createDiscountOffer({
      ptt_id,
      exporter_id,
      asking_price,
      discount_rate,
    });

    return NextResponse.json({
      data: offer,
      message: 'Discount offer created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create discount offer error:', error);
    return NextResponse.json(
      { error: 'Failed to create discount offer' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { offer_id, asking_price, discount_rate } = body;

    if (!offer_id || !asking_price || discount_rate === undefined) {
      return NextResponse.json(
        { error: 'Offer ID, asking price, and discount rate are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update the offer
    const { data: offer, error } = await supabase
      .from('discounting_offers')
      .update({
        asking_price,
        discount_rate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', offer_id)
      .eq('status', 'available')
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: offer,
      message: 'Discount offer updated successfully',
    });
  } catch (error) {
    console.error('Update discount offer error:', error);
    return NextResponse.json(
      { error: 'Failed to update discount offer' },
      { status: 500 }
    );
  }
}
