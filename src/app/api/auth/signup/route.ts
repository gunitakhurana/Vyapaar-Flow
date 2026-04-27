import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This API route uses the Service Role Key to bypass the 3-per-hour IP rate limit 
// on the free tier of Supabase during development testing.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, role, business_name, gst_number } = body;

    if (!phone || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const dummyEmail = `+${cleanPhone}@vyapaarflow.local`;
    const dummyPassword = `VF@${cleanPhone}!2026`;

    // Initialize admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if phone number is already registered in the users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'This phone number is already registered to an account.' },
        { status: 400 }
      );
    }

    // Create user via Admin API (bypasses rate limits and auto-confirms email)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: dummyEmail,
      password: dummyPassword,
      email_confirm: true,
      user_metadata: {
        role,
        business_name,
        phone,
        gst_number,
      },
    });

    if (error) {
      // If user already exists, we can safely ignore it and let the frontend sign them in
      if (error.message.includes('already been registered')) {
        return NextResponse.json({ success: true, message: 'User already exists' });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
