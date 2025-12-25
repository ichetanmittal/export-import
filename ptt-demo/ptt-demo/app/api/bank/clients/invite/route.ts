import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrganization } from '@/lib/db/organizations';
import { createBankClient } from '@/lib/db/bank-clients';
import bcrypt from 'bcrypt';

// Invite a new client (importer or exporter)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bankOrgId,
      clientName,
      clientType, // 'importer' or 'exporter'
      email,
      phone,
      geography,
      country,
      creditLimit,
      relationshipType, // 'issuing' or 'financing'
      pocName,
      pocEmail,
      pocPhone,
      pocPassword, // Password for POC user account
    } = body;

    // Validation
    if (!bankOrgId || !clientName || !clientType || !email || !relationshipType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['importer', 'exporter'].includes(clientType)) {
      return NextResponse.json(
        { error: 'Client type must be importer or exporter' },
        { status: 400 }
      );
    }

    if (!['issuing', 'financing', 'both'].includes(relationshipType)) {
      return NextResponse.json(
        { error: 'Relationship type must be issuing, financing, or both' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if organization already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', clientName)
      .single();

    let clientOrgId: string;

    if (existingOrg) {
      clientOrgId = existingOrg.id;
    } else {
      // Create new organization
      const newOrg = await createOrganization({
        name: clientName,
        type: clientType,
        email,
        phone,
        geography,
        country,
        credit_limit: creditLimit || 0,
        poc_name: pocName,
        poc_email: pocEmail || email,
        poc_phone: pocPhone || phone,
      });
      clientOrgId = newOrg.id;

      // Create POC user account
      const password_hash = await bcrypt.hash(pocPassword || 'TempPass123!', 10);

      const { data: pocUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: pocEmail || email,
          password_hash,
          name: pocName || clientName,
          role: clientType,
          organization: clientName,
          organization_id: clientOrgId,
          phone: pocPhone || phone,
          geography,
          is_poc: true,
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating POC user:', userError);
        throw new Error('Failed to create POC user account');
      }

      // Update organization with POC details
      await supabase
        .from('organizations')
        .update({
          poc_name: pocUser.name,
          poc_email: pocUser.email,
          poc_phone: pocUser.phone,
        })
        .eq('id', clientOrgId);
    }

    // Create bank-client relationship
    const bankClient = await createBankClient({
      bank_org_id: bankOrgId,
      client_org_id: clientOrgId,
      relationship_type: relationshipType,
      credit_limit: creditLimit || 0,
    });

    // Send invitation email (TODO: implement email service)
    // For now, we'll just return the details
    const invitationDetails = {
      clientName,
      email: pocEmail || email,
      temporaryPassword: pocPassword || 'TempPass123!',
      loginUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    return NextResponse.json({
      data: {
        bankClient,
        clientOrgId,
        invitation: invitationDetails,
      },
      message: 'Client invited successfully. Please share the login credentials securely.',
    });
  } catch (error: any) {
    console.error('Error inviting client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite client' },
      { status: 500 }
    );
  }
}
