import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    hasUrl: !!supabaseUrl,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 8) : null,
    urlLength: supabaseUrl ? supabaseUrl.length : 0,
    hasAnonKey: !!supabaseAnonKey,
    anonKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
    envKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
    nodeEnv: process.env.NODE_ENV
  });
}
