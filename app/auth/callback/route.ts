import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth provider error parameters
  if (errorParam || errorDescription) {
    console.error('OAuth Callback Error:', errorParam, errorDescription);
    const errorMsg = errorDescription || errorParam || 'OAuth provider authentication failed';
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorMsg)}`);
  }

  // Handle OAuth authorization code exchange
  if (code) {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error('OAuth Code Exchange Error:', error);
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Fallback for missing code or unconfigured Supabase
  return NextResponse.redirect(`${origin}/?error=missing_oauth_code`);
}
