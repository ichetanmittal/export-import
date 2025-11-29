import { createClient } from '@/lib/supabase/server';
import { DiscountingOffer, DiscountingOfferWithDetails } from '@/lib/types/database';

// Create discount offer
export async function createDiscountOffer(data: {
  ptt_id: string;
  exporter_id: string;
  asking_price: number;
  discount_rate: number;
}) {
  const supabase = await createClient();

  const { data: offer, error } = await supabase
    .from('discounting_offers')
    .insert({
      ptt_id: data.ptt_id,
      exporter_id: data.exporter_id,
      asking_price: data.asking_price,
      discount_rate: data.discount_rate,
      status: 'available',
    })
    .select()
    .single();

  if (error) throw error;
  return offer as DiscountingOffer;
}

// Get marketplace listings
export async function getMarketplaceOffers(filters?: {
  status?: string;
  min_amount?: number;
  max_maturity?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('discounting_offers')
    .select(`
      *,
      ptt:ptt_id(
        id,
        ptt_number,
        amount,
        currency,
        maturity_date,
        status
      ),
      exporter:exporter_id(id, name, organization)
    `);

  // Only show available offers by default
  if (filters?.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.eq('status', 'available');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as DiscountingOfferWithDetails[];
}

// Accept discount offer
export async function acceptDiscountOffer(data: {
  offer_id: string;
  funder_id: string;
}) {
  const supabase = await createClient();

  const { data: offer, error } = await supabase
    .from('discounting_offers')
    .update({
      status: 'accepted',
      funder_id: data.funder_id,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', data.offer_id)
    .select()
    .single();

  if (error) throw error;
  return offer as DiscountingOffer;
}

// Process payment for discount
export async function processDiscountPayment(data: {
  offer_id: string;
  payment_reference: string;
}) {
  const supabase = await createClient();

  // Get the offer details
  const { data: offer, error: offerError } = await supabase
    .from('discounting_offers')
    .select('*, ptt:ptt_id(*)')
    .eq('id', data.offer_id)
    .single();

  if (offerError) throw offerError;

  // Update offer status
  const { error: updateError } = await supabase
    .from('discounting_offers')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: data.payment_reference,
    })
    .eq('id', data.offer_id);

  if (updateError) throw updateError;

  // Transfer PTT ownership to funder
  const ptt = (offer as any).ptt;
  const { error: transferError } = await supabase
    .from('ptt_tokens')
    .update({
      current_owner_id: (offer as any).funder_id,
      status: 'discounted',
    })
    .eq('id', ptt.id);

  if (transferError) throw transferError;

  // Record the transfer
  await supabase.from('ptt_transfers').insert({
    ptt_id: ptt.id,
    from_user_id: (offer as any).exporter_id,
    to_user_id: (offer as any).funder_id,
    transfer_type: 'discounting',
    amount: (offer as any).asking_price,
  });

  return offer;
}

// Get offers by exporter
export async function getOffersByExporter(exporter_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('discounting_offers')
    .select(`
      *,
      ptt:ptt_id(*),
      funder:funder_id(id, name, organization)
    `)
    .eq('exporter_id', exporter_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get offers by funder (accepted/paid)
export async function getOffersByFunder(funder_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('discounting_offers')
    .select(`
      *,
      ptt:ptt_id(*),
      exporter:exporter_id(id, name, organization)
    `)
    .eq('funder_id', funder_id)
    .in('status', ['accepted', 'paid'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
