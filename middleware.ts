import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    
    // Optional: Get session to refresh if needed
    const { data: { session } } = await supabase.auth.getSession()
    
    return res
  } catch (error) {
    // Log the error but don't throw it to prevent middleware from crashing
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Update matcher to be more specific and exclude auth callback routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - auth callback routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|auth/callback|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
