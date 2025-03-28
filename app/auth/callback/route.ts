import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    if (error) {
      console.error('Auth error:', error, errorDescription)
      // Redirect to home page with error message
      return NextResponse.redirect(new URL(`/?error=${error}&error_description=${errorDescription}`, requestUrl.origin))
    }

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase.auth.exchangeCodeForSession(code)
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  } catch (error) {
    console.error('Callback error:', error)
    // Redirect to home page with generic error
    return NextResponse.redirect(new URL('/?error=callback_error', request.url))
  }
}
