import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  return NextResponse.json({
    hasUrl: !!supabaseUrl,
    urlLength: supabaseUrl ? supabaseUrl.length : 0,
    hasAnonKey: !!supabaseAnonKey,
    hasAuthSecret: !!nextAuthSecret,
    envKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_') || key.startsWith('GOOGLE_')),
    nodeEnv: process.env.NODE_ENV
  });
}
