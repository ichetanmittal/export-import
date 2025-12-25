import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/users';
import { UserRole, OrganizationType } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      role,
      organization,
      phone,
      geography,
      bank_account_number,
      ifsc_code,
      bank_role,
      funder_role,
      is_poc = true, // Default to POC
    } = body;

    // Validation
    if (!email || !password || !name || !role || !organization) {
      return NextResponse.json(
        { error: 'Email, password, name, role, and organization are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const supabase = await createClient();

    // Step 1: Find or create organization
    let { data: existingOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', organization)
      .single();

    let organizationId: string;

    if (existingOrg) {
      // Organization exists
      organizationId = existingOrg.id;

      // Update POC info if this is the first POC or if POC info is empty
      if (is_poc && (!existingOrg.poc_name || !existingOrg.poc_email)) {
        await supabase
          .from('organizations')
          .update({
            poc_name: name,
            poc_email: email,
            poc_phone: phone,
          })
          .eq('id', organizationId);
      }
    } else {
      // Create new organization
      const orgType: OrganizationType = role as OrganizationType;

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organization,
          type: orgType,
          email: email, // Organization email defaults to user's email
          phone: phone,
          geography: geography,
          treasury_balance: 0,
          credit_limit: 0,
          credit_used: 0,
          // POC information
          poc_name: name,
          poc_email: email,
          poc_phone: phone,
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        throw new Error('Failed to create organization');
      }

      organizationId = newOrg.id;
    }

    // Step 2: Create user
    const password_hash = await bcrypt.hash(password, 10);

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        name,
        role,
        organization, // Legacy field
        organization_id: organizationId, // New field
        phone,
        geography,
        bank_account_number,
        ifsc_code,
        bank_role,
        funder_role,
        is_poc,
        balance: 0,
        credit_limit: 0,
        credit_used: 0,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      throw new Error('Failed to create user');
    }

    // Step 3: Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      data: {
        user: userWithoutPassword,
        token,
      },
      message: 'User created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
