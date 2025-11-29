import { createClient } from '@/lib/supabase/server';
import { User } from '@/lib/types/database';
import bcrypt from 'bcrypt';

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: User['role'];
  organization?: string;
  phone?: string;
}) {
  const supabase = await createClient();

  // Hash password
  const password_hash = await bcrypt.hash(data.password, 10);

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: data.email,
      password_hash,
      name: data.name,
      role: data.role,
      organization: data.organization || null,
      phone: data.phone || null,
    })
    .select()
    .single();

  if (error) throw error;
  return user as User;
}

export async function getUserByEmail(email: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return null;
  return data as User;
}

export async function getUserById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as User;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return bcrypt.compare(plainPassword, hashedPassword);
}
